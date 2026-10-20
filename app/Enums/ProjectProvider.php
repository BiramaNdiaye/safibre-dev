<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum ProjectProvider: string implements HasLabel
{
    case EGTS = "egts";
    case GreenLinks = "green_links";

    public function getLabel(): string
    {
        return match ($this) {
            self::EGTS => "EGTS",
            self::GreenLinks => "GreenLinks"
        };
    }
}
