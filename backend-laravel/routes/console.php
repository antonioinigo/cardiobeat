<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cardiobeat:setup-db {--fresh : Reinicia y vuelve a crear la base}', function () {
    if ($this->option('fresh')) {
        $this->info('Ejecutando migrate:fresh...');
        Artisan::call('migrate:fresh', ['--force' => true]);
    } else {
        $this->info('Ejecutando migrate...');
        Artisan::call('migrate', ['--force' => true]);
    }

    $this->newLine();
    $this->line(Artisan::output());
    $this->info('Base de datos CardioBeat preparada correctamente.');
})->purpose('Crea el esquema CardioBeat desde migraciones');
