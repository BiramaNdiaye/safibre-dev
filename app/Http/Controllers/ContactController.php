<?php

namespace App\Http\Controllers;

use App\Mail\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        // Piege a robots : un humain ne voit pas ce champ. Rempli, on fait semblant d avoir envoye
        // pour ne pas apprendre au robot qu il a ete detecte.
        if (filled($request->input("site_web"))) {
            return back()->with(["success" => "Votre message a été envoyé avec succès"]);
        }

        $data = $request->validate([
            "name" => "required|string|max:120",
            // "email" => "required|email|max:180",  (avant : la regle email par defaut de Laravel 11
            // laisse passer des retours a la ligne, faille d injection d en-tetes ; filter les refuse)
            "email" => "required|email:rfc,filter|max:180",
            "subject" => "required|string|max:180",
            "message" => "required|string|min:10|max:5000",
        ], [
            "name.required" => "Indiquez votre nom.",
            "email.required" => "Indiquez votre adresse e-mail.",
            "email.email" => "Cette adresse e-mail n'est pas valide.",
            "subject.required" => "Choisissez ou écrivez un objet.",
            "message.required" => "Décrivez votre besoin en quelques lignes.",
            "message.min" => "Votre message est un peu court : 10 caractères au moins.",
        ]);

        // Le message part chez Safibre (et non vers le visiteur, comme avant) ;
        // « Répondre » dans la messagerie renvoie directement au visiteur.
        defer(function () use ($data) {
            Mail::to(config("services.contact.destinataire"))
                ->send(new Contact($data));
        });

        return back()->with(["success" => "Votre message a été envoyé avec succès"]);
    }
}
