<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum TaskName: string implements HasColor, HasLabel
{
    case ROP = 'rop';
    case BLO = 'blo';
    case DOE = "doe";
    case PATATOIDE = "patatoide";

    public function getLabel(): string
    {
        return match ($this) {
            self::BLO => 'BLO',
            self::ROP => 'ROP',
            self::DOE => "DOE",
            self::PATATOIDE => "PATATOIDE",
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::ROP => 'info',
            self::BLO => 'warning',
            self::DOE => "gray",
            self::PATATOIDE => "gray"
        };
    }
}
