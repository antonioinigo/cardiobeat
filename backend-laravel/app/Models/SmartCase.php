<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmartCase extends Model
{
    protected $table = 'smart_cases';

    protected $guarded = [];

    protected $casts = [
        'diagnosis_questions' => 'array',
        'published_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
