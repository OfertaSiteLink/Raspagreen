<?php
require_once __DIR__ . '/vendor/autoload.php';

use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;

// Set your credentials
\MercadoPago\MercadoPagoConfig::setAccessToken("APP_USR-6493240016618428-080712-7ed5d6b7842b265508c0411fa147e896-1782895287");

header('Content-Type: application/json');

try {
    // Get user data from POST request
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create payment
    $client = new PaymentClient();
    
    $payment = $client->create([
        "transaction_amount" => 0.50,
        "description" => "Jogo Centavo da Sorte - Raspadinha",
        "payment_method_id" => "pix",
        "payer" => [
            "email" => $data['email'] ?? 'cliente@email.com',
            "first_name" => $data['name'] ?? 'Cliente',
            "identification" => [
                "type" => "CPF",
                "number" => $data['cpf'] ?? '00000000000'
            ]
        ]
    ]);
    
    // Return payment data
    echo json_encode([
        'success' => true,
        'payment_id' => $payment->id,
        'qr_code' => $payment->point_of_interaction->transaction_data->qr_code,
        'qr_code_base64' => $payment->point_of_interaction->transaction_data->qr_code_base64,
        'ticket_url' => $payment->point_of_interaction->transaction_data->ticket_url
    ]);
    
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

