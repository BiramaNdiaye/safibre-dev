<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
  /**
   * Seed the application's database.
   */
  public function run(): void
  {
    // User::factory(10)->create();

    User::factory()->create([
      'name' => 'Tresor Muco',
      'email' => 'hello@tmuco.dev',
      // 'password' => 'Mucort@123',  (avant : mot de passe en clair dans le code ; a changer s il a servi en ligne)
      // Mot de passe lu dans .env (ADMIN_PASSWORD), sinon tire au hasard et affiche une seule fois
      'password' => $motDePasse = env('ADMIN_PASSWORD') ?: Str::password(20),
    ]);
    if (! env('ADMIN_PASSWORD')) $this->command?->warn("Mot de passe admin genere : {$motDePasse}");
    $projectData = [[
      "provider" => "egts",
      "ref" => "SEM-234-23-0014",
      "type" => "prod",
      "name" => "PAR18 vers ST MAUR / HUB / STADE CHÉRON"
    ],];

    Project::query()->create([]);
  }
}
