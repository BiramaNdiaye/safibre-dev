<?php

namespace App\Providers;

use Filament\Tables\Actions\CreateAction;
use Filament\Tables\Actions\EditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::unguard();
        Model::shouldBeStrict(!app()->isProduction());

        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }
        CreateAction::configureUsing(function (CreateAction $action) {
            return $action->slideOver();
        });
        EditAction::configureUsing(function (EditAction $action) {
            return $action->slideOver();
        });
    }
}
