<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_route_returns_json_response(): void
    {
        $response = $this->getJson('/api/v1/health');

        $this->assertContains($response->getStatusCode(), [200, 503]);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'app',
                'database',
            ],
            'status',
            'database',
            'service',
        ]);
    }
}
