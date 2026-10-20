<?php

use App\Http\Controllers\ContactController;
use Illuminate\Support\Facades\Route;

Route::inertia("/", "home")->name("home");
Route::inertia("/a-propos", "a-propos")->name("a-propos");
Route::inertia("/bureau_etude", "bureau_etude")->name("bureau_etude");
Route::inertia("/operations-telecoms", "operations-telecoms")->name("operations-telecoms");
Route::inertia("/realisations", "realisations")->name("realisations");
Route::inertia("/contact", "contact")->name("contact");
Route::inertia("/legal", "legal")->name("legal");

Route::post("/contact", ContactController::class)
    ->middleware("throttle:5,1")
    ->name("contact.store");

// Anciennes adresses : redirigees pour ne pas perdre les liens deja partages ni le referencement
Route::permanentRedirect("/maintenance_fibre_optique", "/operations-telecoms#maintenance");
Route::permanentRedirect("/centre_telecom", "/bureau_etude#centre");
Route::permanentRedirect("/bureau", "/bureau_etude");
Route::permanentRedirect("/support", "/contact");
Route::permanentRedirect("/waitlist", "/contact");
