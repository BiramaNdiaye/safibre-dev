<?php

use App\Models\Project;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Project::class)->nullable();
            $table->enum('name', ['rop', 'blo']);
            $table->enum('type', ['simple', 'complex']);
            $table->enum('status', ['new', 'in_progress', 'pending', 'completed', 'delivered', 'returned'])->default('new');
            $table->text('status_description')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->string('fci_number')->nullable();
            $table->integer('bpe_number')->nullable();
            $table->boolean('link_terminated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
