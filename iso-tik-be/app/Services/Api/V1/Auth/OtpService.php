<?php

namespace App\Services\Api\V1\Auth;

use App\Models\Auth\OtpCode;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OtpService
{
    public const PURPOSE_LOGIN = 'login';

    public const CHANNEL_EMAIL = 'email';

    public const EXPIRES_IN_SECONDS = 300;

    public const MAX_ATTEMPTS = 5;

    public function isLoginOtpEnabled(): bool
    {
        $setting = Setting::query()->where('key', 'security.login_otp.enabled')->first();

        if (! $setting) {
            return false;
        }

        return $this->toBool($setting->value, false);
    }

    public function issue(User $user, Request $request): array
    {
        OtpCode::query()
            ->where('user_id', $user->id)
            ->where('purpose', self::PURPOSE_LOGIN)
            ->where('channel', self::CHANNEL_EMAIL)
            ->whereNull('consumed_at')
            ->update([
                'consumed_at' => now(),
                'updated_at' => now(),
            ]);

        $plainOtp = (string) random_int(100000, 999999);
        $sentTo = $this->resolveSentTo($user);
        $expiresAt = now()->addSeconds(self::EXPIRES_IN_SECONDS);

        OtpCode::create([
            'user_id' => $user->id,
            'purpose' => self::PURPOSE_LOGIN,
            'channel' => self::CHANNEL_EMAIL,
            'sent_to' => $sentTo,
            'code_hash' => Hash::make($plainOtp),
            'attempts' => 0,
            'max_attempts' => self::MAX_ATTEMPTS,
            'expires_at' => $expiresAt,
        ]);

        $mailSent = $this->sendLoginOtp($sentTo, $plainOtp, $expiresAt);

        return [
            'plain_otp' => $plainOtp,
            'sent_to' => $this->maskEmail($sentTo),
            'expires_at' => $expiresAt,
            'expires_in' => self::EXPIRES_IN_SECONDS,
            'max_attempts' => self::MAX_ATTEMPTS,
            'mail_sent' => $mailSent,
        ];
    }

    public function validate(User $user, string $otp): array
    {
        $normalizedOtp = preg_replace('/\D/', '', $otp);

        if (strlen((string) $normalizedOtp) !== 6) {
            return ['valid' => false, 'message' => 'Invalid OTP', 'status' => 422];
        }

        $record = OtpCode::query()
            ->active()
            ->where('user_id', $user->id)
            ->where('purpose', self::PURPOSE_LOGIN)
            ->where('channel', self::CHANNEL_EMAIL)
            ->orderByDesc('created_at')
            ->first();

        if (! $record) {
            return ['valid' => false, 'message' => 'Invalid OTP', 'status' => 422];
        }

        if ($record->attempts >= $record->max_attempts) {
            return ['valid' => false, 'message' => 'OTP attempts exceeded', 'status' => 429];
        }

        if (! Hash::check((string) $normalizedOtp, $record->code_hash)) {
            $record->increment('attempts');

            return [
                'valid' => false,
                'message' => 'Invalid OTP',
                'status' => 422,
                'otp_attempts_remaining' => max(0, $record->max_attempts - ($record->attempts + 1)),
                'otp_max_attempts' => $record->max_attempts,
            ];
        }

        $record->forceFill([
            'consumed_at' => now(),
        ])->save();

        return ['valid' => true];
    }

    public function otpRequiredPayload(User $user, string $identifier, array $otpData = []): array
    {
        $payload = [
            'otp_required' => true,
            'requires_otp' => true,
            'step' => 'otp',
            'login' => $identifier,
            'username' => $identifier,
            'otp_channel' => self::CHANNEL_EMAIL,
            'otp_sent_to' => $otpData['sent_to'] ?? $this->maskEmail($this->resolveSentTo($user)),
            'otp_attempts_remaining' => self::MAX_ATTEMPTS,
            'otp_max_attempts' => self::MAX_ATTEMPTS,
            'expires_in' => $otpData['expires_in'] ?? self::EXPIRES_IN_SECONDS,
        ];

        if (app()->environment('local') && isset($otpData['plain_otp'])) {
            $payload['dev_otp'] = $otpData['plain_otp'];
            $payload['otp_debug_code'] = $otpData['plain_otp'];
        }

        return $payload;
    }

    private function resolveSentTo(User $user): ?string
    {
        $user->loadMissing('contact');

        return $user->contact?->email_institutional
            ?: $user->contact?->email_personal
            ?: $user->email;
    }

    private function maskEmail(?string $email): ?string
    {
        if (! $email || ! str_contains($email, '@')) {
            return $email;
        }

        return preg_replace('/(^.).+(@.+$)/', '$1***$2', $email);
    }

    private function sendLoginOtp(?string $sentTo, string $plainOtp, mixed $expiresAt): bool
    {
        if (! $sentTo) {
            Log::warning('Login OTP was issued without a destination email.');

            return false;
        }

        try {
            Mail::html(
                $this->loginOtpHtml($plainOtp),
                function ($message) use ($sentTo, $plainOtp): void {
                    $message
                        ->to($sentTo)
                        ->subject('Kode OTP Login Audit Internal UPA TIK')
                        ->text(
                            "Kode OTP login Audit Internal UPA TIK Anda adalah {$plainOtp}.\n\n".
                            "Kode ini berlaku selama 5 menit. Abaikan email ini jika Anda tidak mencoba login."
                        );
                }
            );

            return true;
        } catch (Throwable $exception) {
            Log::error('Failed to send login OTP email.', [
                'sent_to' => $sentTo,
                'expires_at' => $expiresAt,
                'error' => $exception->getMessage(),
            ]);
        }

        return false;
    }

    private function loginOtpHtml(string $plainOtp): string
    {
        $otp = e($plainOtp);

        return <<<HTML
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kode OTP Login Audit Internal UPA TIK</title>
</head>
<body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f766e;padding:22px 28px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Audit Internal UPA TIK</div>
              <div style="font-size:22px;font-weight:700;margin-top:6px;">Verifikasi Login</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Gunakan kode OTP berikut untuk melanjutkan proses login ke sistem Audit Internal UPA TIK.</p>
              <div style="margin:22px 0;padding:18px 20px;background:#ecfeff;border:1px solid #99f6e4;border-radius:10px;text-align:center;">
                <div style="font-size:12px;color:#0f766e;text-transform:uppercase;letter-spacing:.12em;font-weight:700;">Kode OTP</div>
                <div style="font-size:36px;line-height:1.2;letter-spacing:.18em;font-weight:800;color:#0f172a;margin-top:8px;">{$otp}</div>
              </div>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">Kode ini berlaku selama <strong>5 menit</strong>.</p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Abaikan email ini jika Anda tidak mencoba login. Jangan bagikan kode ini kepada siapa pun.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              Email otomatis dari sistem Audit Internal UPA TIK.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    private function toBool(mixed $value, bool $default): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_array($value) && array_key_exists('enabled', $value)) {
            return $this->toBool($value['enabled'], $default);
        }

        if (is_numeric($value)) {
            return (int) $value !== 0;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            if (in_array($normalized, ['1', 'true', 'yes', 'on', 'enabled'], true)) {
                return true;
            }

            if (in_array($normalized, ['0', 'false', 'no', 'off', 'disabled', ''], true)) {
                return false;
            }
        }

        return $default;
    }
}
