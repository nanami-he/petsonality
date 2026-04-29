# petsonality status line - native PowerShell renderer for Windows
# Reads ~/.petsonality/status.json, session reaction JSON, and generated pet-art.json.

$ErrorActionPreference = "SilentlyContinue"

$HomeDir = $env:USERPROFILE
if ([string]::IsNullOrWhiteSpace($HomeDir)) { $HomeDir = [Environment]::GetFolderPath("UserProfile") }
if ([string]::IsNullOrWhiteSpace($HomeDir)) { $HomeDir = $env:HOME }
if ([string]::IsNullOrWhiteSpace($HomeDir)) { exit 0 }
$StateDir = Join-Path $HomeDir ".petsonality"
$StateFile = Join-Path $StateDir "status.json"
$ArtFile = Join-Path $PSScriptRoot "pet-art.json"

if (-not (Test-Path -LiteralPath $StateFile)) { exit 0 }
if (-not (Test-Path -LiteralPath $ArtFile)) { exit 0 }

function Read-JsonFile($Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  try {
    return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json)
  } catch {
    return $null
  }
}

function Now-Ms {
  return [int64](([DateTime]::UtcNow - [DateTime]'1970-01-01T00:00:00Z').TotalMilliseconds)
}

function First-Text($Value) {
  if ($null -eq $Value) { return "" }
  return [string]$Value
}

function Get-SessionId {
  $sid = $env:TMUX_PANE
  if ([string]::IsNullOrWhiteSpace($sid)) { return "default" }
  return $sid.TrimStart('%')
}

function Get-TerminalColumns {
  $cols = 0
  try { $cols = [int]$Host.UI.RawUI.WindowSize.Width } catch { $cols = 0 }
  if ($cols -lt 40) {
    try { $cols = [int]$env:COLUMNS } catch { $cols = 0 }
  }
  if ($cols -lt 40) { $cols = 80 }
  return $cols
}

function Display-Width($Text) {
  if ($null -eq $Text) { return 0 }
  return ([string]$Text).Length
}

function Repeat-Text($Text, $Count) {
  if ($Count -le 0) { return "" }
  return ([string]$Text) * [int]$Count
}

function Get-JsonProperty($Object, $Name) {
  if ($null -eq $Object) { return $null }
  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) { return $null }
  return $property.Value
}

function Read-Action($Path, $ValidTypesPattern) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $raw = First-Text (Get-Content -LiteralPath $Path -Raw -Encoding UTF8).Trim()
  $match = [regex]::Match($raw, "^ACT_TYPE=($ValidTypesPattern); ACT_LEFT=([0-9]+)(; ACT_STEP=([0-9]+))?$")
  if (-not $match.Success) {
    Remove-Item -LiteralPath $Path -Force
    return $null
  }
  $left = [int]$match.Groups[2].Value
  if ($left -le 0) {
    Remove-Item -LiteralPath $Path -Force
    return $null
  }
  $step = 0
  if ($match.Groups[4].Success) { $step = [int]$match.Groups[4].Value }
  return @{ Type = $match.Groups[1].Value; Left = $left; Step = $step }
}

function Tick-Action($Path, $Action, $OnEndText) {
  $nextLeft = [int]$Action.Left - 1
  $nextStep = [int]$Action.Step + 1
  if ($nextLeft -le 0) {
    if ([string]::IsNullOrEmpty($OnEndText)) {
      Remove-Item -LiteralPath $Path -Force
    } else {
      Set-Content -LiteralPath $Path -Value $OnEndText -NoNewline -Encoding UTF8
    }
    return
  }
  Set-Content -LiteralPath $Path -Value "ACT_TYPE=$($Action.Type); ACT_LEFT=$nextLeft; ACT_STEP=$nextStep" -NoNewline -Encoding UTF8
}

function Start-Action($FileName, $Type, $Left, $Step) {
  $path = Join-Path $StateDir $FileName
  Set-Content -LiteralPath $path -Value "ACT_TYPE=$Type; ACT_LEFT=$Left; ACT_STEP=$Step" -NoNewline -Encoding UTF8
}

function Pick-FrameFromActiveAction($PetId) {
  switch ($PetId) {
    "labrador" {
      $path = Join-Path $StateDir ".lab_act"
      $a = Read-Action $path "nuzzle|yawn|pant|liedown"
      if ($a) {
        switch ($a.Type) {
          "nuzzle" { $frame = 3 }
          "yawn" { $frame = 4 }
          "pant" { $frame = 5 }
          "liedown" {
            $roll = Get-Random -Minimum 0 -Maximum 100
            if ($roll -lt 10) { $frame = 7 } elseif ($roll -lt 20) { $frame = 8 } else { $frame = 6 }
          }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "deer" {
      $path = Join-Path $StateDir ".deer_act"
      $a = Read-Action $path "graze|tilt|gaze|nuzzle"
      if ($a) {
        $map = @{ graze = 3; tilt = 4; gaze = 5; nuzzle = 6 }
        Tick-Action $path $a ""
        return $map[$a.Type]
      }
    }
    "wolf" {
      $path = Join-Path $StateDir ".wolf_act"
      $a = Read-Action $path "walk|howl|alert|stretch|sniff"
      if ($a) {
        $map = @{ walk = 3; howl = 4; alert = 5; stretch = 6; sniff = 7 }
        Tick-Action $path $a ""
        return $map[$a.Type]
      }
    }
    "bear" {
      $path = Join-Path $StateDir ".bear_act"
      $a = Read-Action $path "slam|wave|cooldown"
      if ($a) {
        switch ($a.Type) {
          "slam" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 4 } else { $frame = 5 } }
          "wave" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 1 } else { $frame = 3 } }
          default { $frame = 0 }
        }
        $onEnd = ""
        if ($a.Type -ne "cooldown") { $onEnd = "ACT_TYPE=cooldown; ACT_LEFT=30; ACT_STEP=0" }
        Tick-Action $path $a $onEnd
        return $frame
      }
    }
    "beaver" {
      $path = Join-Path $StateDir ".beaver_act"
      $a = Read-Action $path "gnaw|slap|inspect|sigh"
      if ($a) {
        switch ($a.Type) {
          "gnaw" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 3 } else { $frame = 7 } }
          "slap" { $frame = 4 }
          "inspect" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 5 } else { $frame = 8 } }
          default { $frame = 6 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "elephant" {
      $path = Join-Path $StateDir ".eleph_act"
      $a = Read-Action $path "stomp|trunk|listen|nod"
      if ($a) {
        switch ($a.Type) {
          "stomp" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 3 } else { $frame = 4 } }
          "trunk" { $frame = 5 }
          "listen" { $frame = 6 }
          default { $frame = 7 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "lion" {
      $path = Join-Path $StateDir ".lion_act"
      $a = Read-Action $path "roar|shake|glare|yawn"
      if ($a) {
        switch ($a.Type) {
          "roar" { $frame = 3 }
          "shake" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 4 } else { $frame = 5 } }
          "glare" { $frame = 6 }
          default { $frame = 7 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "golden" {
      $path = Join-Path $StateDir ".gold_act"
      $a = Read-Action $path "wag|jump|lick|spin"
      if ($a) {
        switch ($a.Type) {
          "wag" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 3 } else { $frame = 1 } }
          "jump" { $frame = 4 }
          "lick" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 5 } else { $frame = 7 } }
          default { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 6 } else { $frame = 0 } }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "cat" {
      $path = Join-Path $StateDir ".cat_act"
      $a = Read-Action $path "stare|lick|stretch"
      if ($a) {
        $map = @{ stare = 3; lick = 4; stretch = 5 }
        Tick-Action $path $a ""
        return $map[$a.Type]
      }
    }
    "panda" {
      $path = Join-Path $StateDir ".panda_act"
      $a = Read-Action $path "eat|roll|stare|frown"
      if ($a) {
        switch ($a.Type) {
          "eat" {
            $stage = [math]::Floor($a.Step / 10)
            if ($stage -le 4) { $frame = 3 + [int]$stage } else { $frame = 0 }
          }
          "roll" { $frame = 8 }
          "stare" { $frame = 9 }
          default { $frame = 10 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "cheetah" {
      $path = Join-Path $StateDir ".cheetah_act"
      $a = Read-Action $path "sprint|pounce|twitch|yawn"
      if ($a) {
        switch ($a.Type) {
          "sprint" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 3 } else { $frame = 4 } }
          "pounce" { $frame = 5 }
          "twitch" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 6 } else { $frame = 7 } }
          default { $frame = 8 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
    "parrot" {
      $path = Join-Path $StateDir ".parrot_act"
      $a = Read-Action $path "sing|flap|bob|preen"
      if ($a) {
        switch ($a.Type) {
          "sing" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 3 } else { $frame = 4 } }
          "flap" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 5 } else { $frame = 6 } }
          "bob" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 7 } else { $frame = 8 } }
          default { $frame = 9 }
        }
        Tick-Action $path $a ""
        return $frame
      }
    }
  }
  return $null
}

function Pick-MoveFrame($PetId) {
  switch ($PetId) {
    { $_ -eq "owl" -or $_ -eq "raven" } { if ((Get-Random -Minimum 0 -Maximum 2) -eq 0) { return 1 } else { return 3 } }
    "labrador" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 25) { Start-Action ".lab_act" "nuzzle" (Get-Random -Minimum 10 -Maximum 20) 0; return 3 }
      if ($r -lt 50) { Start-Action ".lab_act" "yawn" (Get-Random -Minimum 20 -Maximum 30) 0; return 4 }
      if ($r -lt 75) { Start-Action ".lab_act" "pant" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      Start-Action ".lab_act" "liedown" (Get-Random -Minimum 1500 -Maximum 2100) 0; return 6
    }
    "deer" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".deer_act" "graze" (Get-Random -Minimum 20 -Maximum 30) 0; return 3 }
      if ($r -lt 55) { Start-Action ".deer_act" "tilt" (Get-Random -Minimum 10 -Maximum 20) 0; return 4 }
      if ($r -lt 85) { Start-Action ".deer_act" "gaze" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      Start-Action ".deer_act" "nuzzle" (Get-Random -Minimum 10 -Maximum 20) 0; return 6
    }
    "wolf" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".wolf_act" "walk" (Get-Random -Minimum 20 -Maximum 30) 0; return 3 }
      if ($r -lt 55) { Start-Action ".wolf_act" "howl" (Get-Random -Minimum 15 -Maximum 25) 0; return 4 }
      if ($r -lt 80) { Start-Action ".wolf_act" "alert" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      if ($r -lt 95) { Start-Action ".wolf_act" "sniff" (Get-Random -Minimum 10 -Maximum 20) 0; return 7 }
      Start-Action ".wolf_act" "stretch" (Get-Random -Minimum 20 -Maximum 30) 0; return 6
    }
    "bear" {
      if ((Get-Random -Minimum 0 -Maximum 100) -lt 60) {
        Start-Action ".bear_act" "wave" (Get-Random -Minimum 120 -Maximum 160) 1; return 1
      }
      Start-Action ".bear_act" "slam" ((Get-Random -Minimum 2 -Maximum 5) * 20) 0; return 4
    }
    "beaver" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".beaver_act" "gnaw" (Get-Random -Minimum 40 -Maximum 60) 0; return 3 }
      if ($r -lt 65) { Start-Action ".beaver_act" "inspect" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      if ($r -lt 85) { Start-Action ".beaver_act" "sigh" (Get-Random -Minimum 20 -Maximum 30) 0; return 6 }
      Start-Action ".beaver_act" "slap" (Get-Random -Minimum 10 -Maximum 20) 0; return 4
    }
    "panda" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 40) { Start-Action ".panda_act" "eat" 50 0; return 3 }
      if ($r -lt 65) { Start-Action ".panda_act" "stare" (Get-Random -Minimum 50 -Maximum 70) 0; return 9 }
      if ($r -lt 85) { Start-Action ".panda_act" "frown" (Get-Random -Minimum 15 -Maximum 25) 0; return 10 }
      Start-Action ".panda_act" "roll" (Get-Random -Minimum 10 -Maximum 20) 0; return 8
    }
    "cat" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 40) { Start-Action ".cat_act" "lick" (Get-Random -Minimum 30 -Maximum 40) 0; return 4 }
      if ($r -lt 75) { Start-Action ".cat_act" "stare" (Get-Random -Minimum 20 -Maximum 30) 0; return 3 }
      Start-Action ".cat_act" "stretch" (Get-Random -Minimum 20 -Maximum 30) 0; return 5
    }
    "golden" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 35) { Start-Action ".gold_act" "wag" (Get-Random -Minimum 40 -Maximum 60) 0; return 3 }
      if ($r -lt 60) { Start-Action ".gold_act" "jump" (Get-Random -Minimum 10 -Maximum 20) 0; return 4 }
      if ($r -lt 85) { Start-Action ".gold_act" "lick" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      Start-Action ".gold_act" "spin" (Get-Random -Minimum 80 -Maximum 100) 0; return 6
    }
    "lion" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".lion_act" "roar" (Get-Random -Minimum 30 -Maximum 40) 0; return 3 }
      if ($r -lt 55) { Start-Action ".lion_act" "shake" (Get-Random -Minimum 40 -Maximum 60) 0; return 4 }
      if ($r -lt 80) { Start-Action ".lion_act" "yawn" (Get-Random -Minimum 30 -Maximum 40) 0; return 7 }
      Start-Action ".lion_act" "glare" (Get-Random -Minimum 20 -Maximum 30) 0; return 6
    }
    "elephant" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 35) { Start-Action ".eleph_act" "listen" (Get-Random -Minimum 20 -Maximum 30) 0; return 6 }
      if ($r -lt 60) { Start-Action ".eleph_act" "nod" (Get-Random -Minimum 20 -Maximum 30) 0; return 7 }
      if ($r -lt 85) { Start-Action ".eleph_act" "trunk" (Get-Random -Minimum 20 -Maximum 30) 0; return 5 }
      Start-Action ".eleph_act" "stomp" (Get-Random -Minimum 40 -Maximum 60) 0; return 3
    }
    "cheetah" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".cheetah_act" "sprint" (Get-Random -Minimum 30 -Maximum 50) 0; return 3 }
      if ($r -lt 55) { Start-Action ".cheetah_act" "pounce" (Get-Random -Minimum 15 -Maximum 25) 0; return 5 }
      if ($r -lt 80) { Start-Action ".cheetah_act" "twitch" (Get-Random -Minimum 10 -Maximum 20) 0; return 6 }
      Start-Action ".cheetah_act" "yawn" (Get-Random -Minimum 20 -Maximum 30) 0; return 8
    }
    "parrot" {
      $r = Get-Random -Minimum 0 -Maximum 100
      if ($r -lt 30) { Start-Action ".parrot_act" "sing" (Get-Random -Minimum 30 -Maximum 50) 0; return 3 }
      if ($r -lt 55) { Start-Action ".parrot_act" "flap" (Get-Random -Minimum 15 -Maximum 25) 0; return 5 }
      if ($r -lt 80) { Start-Action ".parrot_act" "bob" (Get-Random -Minimum 20 -Maximum 40) 0; return 7 }
      Start-Action ".parrot_act" "preen" (Get-Random -Minimum 20 -Maximum 30) 0; return 9
    }
    default { return 1 }
  }
}

function Pick-IdleFrame($PetId) {
  $r = Get-Random -Minimum 0 -Maximum 1000
  switch ($PetId) {
    "labrador" { if ($r -lt 10) { return 1 } }
    "deer" { if ($r -lt 8) { return 1 } }
    "wolf" { if ($r -lt 5) { return 2 } elseif ($r -lt 10) { return 1 } }
    "bear" { if (-not (Test-Path -LiteralPath (Join-Path $StateDir ".bear_act")) -and $r -lt 2) { return 6 } }
    "elephant" { if ($r -lt 6) { return 1 } }
    "cheetah" { if ($r -lt 8) { return 1 } }
    "parrot" { if ($r -lt 15) { return 1 } }
  }
  return 0
}

function Get-AnimationFrame($PetId) {
  $activeFrame = Pick-FrameFromActiveAction $PetId
  if ($null -ne $activeFrame) { return @{ Frame = [int]$activeFrame; Blink = $false } }

  $blinkPath = Join-Path $StateDir ".blink"
  if (Test-Path -LiteralPath $blinkPath) {
    $left = 0
    try { $left = [int](Get-Content -LiteralPath $blinkPath -Raw -Encoding UTF8) } catch { $left = 0 }
    if ($left -gt 0) {
      Set-Content -LiteralPath $blinkPath -Value ($left - 1) -NoNewline -Encoding UTF8
      if ($PetId -eq "raven" -or $PetId -eq "owl" -or $PetId -eq "bear") { return @{ Frame = 2; Blink = $false } }
      return @{ Frame = 0; Blink = $true }
    }
    Remove-Item -LiteralPath $blinkPath -Force
  }

  $idlePct = 75; $movePct = 15; $blinkPct = 10
  switch ($PetId) {
    "owl" { $idlePct = 80; $movePct = 15; $blinkPct = 5 }
    "cat" { $idlePct = 88; $movePct = 7; $blinkPct = 5 }
    "raven" { $idlePct = 60; $movePct = 33; $blinkPct = 7 }
    "bear" { $idlePct = 94; $movePct = 3; $blinkPct = 3 }
    "parrot" { $idlePct = 50; $movePct = 30; $blinkPct = 20 }
    "dolphin" { $idlePct = 55; $movePct = 30; $blinkPct = 15 }
    "fox" { $idlePct = 65; $movePct = 25; $blinkPct = 10 }
    "panda" { $idlePct = 88; $movePct = 7; $blinkPct = 5 }
    "cheetah" { $idlePct = 60; $movePct = 28; $blinkPct = 12 }
    "wolf" { $idlePct = 97; $movePct = 3; $blinkPct = 0 }
    "deer" { $idlePct = 92; $movePct = 5; $blinkPct = 3 }
    "labrador" { $idlePct = 90; $movePct = 6; $blinkPct = 4 }
    "beaver" { $idlePct = 90; $movePct = 7; $blinkPct = 3 }
    "elephant" { $idlePct = 92; $movePct = 5; $blinkPct = 3 }
    "lion" { $idlePct = 80; $movePct = 15; $blinkPct = 5 }
    "golden" { $idlePct = 70; $movePct = 22; $blinkPct = 8 }
  }

  $roll = Get-Random -Minimum 0 -Maximum 1000
  if ($roll -lt $blinkPct) {
    Set-Content -LiteralPath $blinkPath -Value "4" -NoNewline -Encoding UTF8
    if ($PetId -eq "raven" -or $PetId -eq "owl" -or $PetId -eq "bear") { return @{ Frame = 2; Blink = $false } }
    return @{ Frame = 0; Blink = $true }
  }
  if ($roll -lt ($blinkPct + $movePct)) { return @{ Frame = [int](Pick-MoveFrame $PetId); Blink = $false } }
  return @{ Frame = [int](Pick-IdleFrame $PetId); Blink = $false }
}

function Apply-Blink($Lines) {
  $closed = "-"
  $dotEye = [string][char]0x2022
  $middleDot = [string][char]0x00B7
  $fisheye = [string][char]0x25C9
  $result = @()
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    $line = [string]$Lines[$i]
    if ($i -lt 3) {
      $line = $line.Replace("o", $closed).Replace("@", $closed).Replace($dotEye, $closed).Replace($middleDot, $closed).Replace($fisheye, $closed)
    }
    $result += $line
  }
  return $result
}

$state = Read-JsonFile $StateFile
if ($null -eq $state) { exit 0 }
if ($state.muted -eq $true) { exit 0 }

$name = First-Text $state.name
$petId = First-Text $state.petId
if ([string]::IsNullOrWhiteSpace($name)) { exit 0 }
if ([string]::IsNullOrWhiteSpace($petId)) { exit 0 }

$artData = Read-JsonFile $ArtFile
if ($null -eq $artData) { exit 0 }
$animal = Get-JsonProperty $artData.animals $petId
if ($null -eq $animal) { exit 0 }

$sid = Get-SessionId
$reactionFile = Join-Path $StateDir ("reaction.{0}.json" -f $sid)
$reaction = Read-JsonFile $reactionFile
$textLines = @()
$lineWidths = @()
$maxDw = 0
if ($null -ne $reaction) {
  $timestamp = 0
  try { $timestamp = [int64]$reaction.timestamp } catch { $timestamp = 0 }
  $age = (Now-Ms) - $timestamp
  $reactionText = First-Text $reaction.reaction
  if ($age -lt 10000 -and -not [string]::IsNullOrWhiteSpace($reactionText)) {
    if ($reaction.wrapped) { foreach ($line in $reaction.wrapped) { if (-not [string]::IsNullOrEmpty([string]$line)) { $textLines += [string]$line } } }
    if ($reaction.widths) { foreach ($w in $reaction.widths) { $lineWidths += [int]$w } }
    try { $maxDw = [int]$reaction.maxWidth } catch { $maxDw = 0 }
    if ($textLines.Count -eq 0) { $textLines += $reactionText }
  }
}

$pick = Get-AnimationFrame $petId
$frameIndex = [int]$pick.Frame
if ($frameIndex -lt 0 -or $frameIndex -ge $animal.frames.Count) { $frameIndex = 0 }
$rawLines = @($animal.frames[$frameIndex])
if ($pick.Blink) { $rawLines = Apply-Blink $rawLines }

$esc = [char]27
$nc = "${esc}[0m"
$dim = "${esc}[3m"
$color = First-Text $animal.color
$bubbleColor = First-Text $animal.bubbleColor
$brailleBlank = [string][char]0x2800

$allLines = @()
$allColors = @()
foreach ($line in $rawLines) {
  $s = [string]$line
  if (($s -replace " ", "") -ne "") {
    $allLines += $s
    $allColors += $color
  }
}

$namePad = 4 - [math]::Floor($name.Length / 2)
if ($namePad -lt 0) { $namePad = 0 }
$allLines += ((Repeat-Text " " $namePad) + $name)
$allColors += $dim

$artW = 12
$innerW = 28
if ($maxDw -gt 0) { $innerW = $maxDw + 2 }
$boxW = $innerW + 4
$bubbleLines = @()
$bubbleTypes = @()
if ($textLines.Count -gt 0) {
  $border = Repeat-Text "-" ($boxW - 2)
  $bubbleLines += ".$border."
  $bubbleTypes += "border"
  for ($i = 0; $i -lt $textLines.Count; $i++) {
    $tl = [string]$textLines[$i]
    if ($i -lt $lineWidths.Count) { $tlDw = [int]$lineWidths[$i] } else { $tlDw = Display-Width $tl }
    $pad = $innerW - $tlDw
    if ($pad -lt 0) { $pad = 0 }
    $bubbleLines += ($tl + (Repeat-Text " " $pad))
    $bubbleTypes += "text"
  }
  $bubbleLines += "`$border'"
  $bubbleTypes += "border"
}

$cols = Get-TerminalColumns
$gap = 2
if ($bubbleLines.Count -gt 0) { $totalW = $boxW + $gap + $artW } else { $totalW = $artW }
$margin = 8
$padLeft = $cols - $totalW - $margin
if ($padLeft -lt 0) { $padLeft = 0 }
$spacer = $brailleBlank + (Repeat-Text " " $padLeft)
$connectorIndex = -1
if ($bubbleLines.Count -gt 2) { $connectorIndex = [math]::Floor((1 + ($bubbleLines.Count - 2)) / 2) }

$totalLines = $allLines.Count
if ($bubbleLines.Count -gt $totalLines) { $totalLines = $bubbleLines.Count }
$artEmpty = Repeat-Text " " $artW

for ($i = 0; $i -lt $totalLines; $i++) {
  if ($i -lt $allLines.Count) {
    $artPart = ([string]$allColors[$i]) + ([string]$allLines[$i]) + $nc
  } else {
    $artPart = $artEmpty
  }

  if ($bubbleLines.Count -gt 0) {
    if ($i -lt $bubbleLines.Count) {
      $bline = [string]$bubbleLines[$i]
      $btype = [string]$bubbleTypes[$i]
      if ($i -eq $connectorIndex) { $gapText = $bubbleColor + "--" + $nc + " " } else { $gapText = "   " }
      if ($btype -eq "border") {
        [Console]::Out.WriteLine($spacer + $bubbleColor + $bline + $nc + $gapText + $artPart)
      } else {
        [Console]::Out.WriteLine($spacer + $bubbleColor + "|" + $nc + " " + $dim + $bline + $nc + " " + $bubbleColor + "|" + $nc + $gapText + $artPart)
      }
    } else {
      [Console]::Out.WriteLine($spacer + (Repeat-Text " " $boxW) + "   " + $artPart)
    }
  } else {
    [Console]::Out.WriteLine($spacer + $artPart)
  }
}

exit 0
