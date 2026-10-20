<?php

namespace App\Services;

use Hidehalo\Nanoid\Client;

class NanoIdGenerator
{
    private const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private const PREFIX = 'PROJ-';

    private const ID_LENGTH = 10;

    public static function generate(): string
    {
        $client = new Client;
        $nanoid = $client->formattedId(self::ALPHABET, self::ID_LENGTH);

        return self::PREFIX.$nanoid;
    }
}
