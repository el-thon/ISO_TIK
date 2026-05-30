<?php

namespace Database\Seeders\System;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SystemClausesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $groups = [
            ['prefix' => 'A.5', 'start' => 1, 'end' => 6, 'name' => 'Kebijakan Keamanan Informasi'],
            ['prefix' => 'A.5', 'start' => 7, 'end' => 8, 'name' => 'Intelijen Ancaman & Keamanan Cloud'],
            ['prefix' => 'A.5', 'start' => 9, 'end' => 18, 'name' => 'Manajemen Aset, Klasifikasi Informasi, dan Pengendalian Akses (Organisasi)'],
            ['prefix' => 'A.5', 'start' => 19, 'end' => 23, 'name' => 'Keamanan dalam Hubungan dengan Pemasok dan Pihak Ketiga'],
            ['prefix' => 'A.5', 'start' => 24, 'end' => 28, 'name' => 'Manajemen Insiden Keamanan Informasi & Kesiapsiagaan'],
            ['prefix' => 'A.5', 'start' => 29, 'end' => 31, 'name' => 'Keamanan dalam Kontinuitas Bisnis dan Kepatuhan'],
            ['prefix' => 'A.6', 'start' => 1, 'end' => 2, 'name' => 'Penyaringan (Screening) dan Syarat-syarat Kerja'],
            ['prefix' => 'A.6', 'start' => 3, 'end' => 5, 'name' => 'Tanggung Jawab Keamanan selama Masa Kerja'],
            ['prefix' => 'A.6', 'start' => 6, 'end' => 8, 'name' => 'Penghentian atau Perubahan Tugas Kerja'],
            ['prefix' => 'A.7', 'start' => 1, 'end' => 3, 'name' => 'Perimeter Keamanan Fisik'],
            ['prefix' => 'A.7', 'start' => 4, 'end' => 7, 'name' => 'Keamanan Ruangan, Kantor, dan Fasilitas'],
            ['prefix' => 'A.7', 'start' => 8, 'end' => 11, 'name' => 'Keamanan Perangkat, Clear Desk, dan Penanganan Aset Fisik'],
            ['prefix' => 'A.7', 'start' => 12, 'end' => 14, 'name' => 'Keamanan Utilitas, Kabel, dan Perawatan Peralatan'],
            ['prefix' => 'A.8', 'start' => 1, 'end' => 4, 'name' => 'Perlindungan Malware, Manajemen Kerentanan Teknis, dan Backup'],
            ['prefix' => 'A.8', 'start' => 5, 'end' => 8, 'name' => 'Manajemen Log dan Pemantauan'],
            ['prefix' => 'A.8', 'start' => 9, 'end' => 12, 'name' => 'Konfigurasi Keamanan Sistem dan Jaringan'],
            ['prefix' => 'A.8', 'start' => 13, 'end' => 16, 'name' => 'Manajemen Proyek & Perubahan Sistem, Pengujian Keamanan, dan Pengembangan Aplikasi yang Aman'],
            ['prefix' => 'A.8', 'start' => 17, 'end' => 20, 'name' => 'Manajemen Akses Pengguna'],
            ['prefix' => 'A.8', 'start' => 21, 'end' => 28, 'name' => 'Keamanan Jaringan, Kriptografi, dan Perlindungan Data di Berbagai Media'],
            ['prefix' => 'A.8', 'start' => 29, 'end' => 34, 'name' => 'Keamanan dalam Pengembangan dan Pemeliharaan Perangkat Lunak'],
        ];

        foreach ($groups as $group) {
            for ($i = $group['start']; $i <= $group['end']; $i++) {
                $code = $group['prefix'].'.'.$i;
                DB::table('system.clauses')->updateOrInsert(
                    ['code' => $code],
                    [
                        'id' => (string) Str::uuid(),
                        'code' => $code,
                        'name' => $code.' - '.$group['name'],
                        'description' => $group['name'],
                        'is_active' => true,
                        'created_by_user_id' => null,
                        'updated_by_user_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                        'deleted_at' => null,
                    ]
                );
            }
        }
    }
}
