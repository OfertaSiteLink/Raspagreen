<?php
require_once __DIR__ . '/vendor/autoload.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\PaymentClient;

// Set your credentials
MercadoPagoConfig::setAccessToken("APP_USR-6493240016618428-080712-7ed5d6b7842b265508c0411fa147e896-1782895287");

header('Content-Type: application/json');

try {
    // Get payment ID from query string
    $paymentId = $_GET['payment_id'] ?? null;
    
    if (!$paymentId) {
        throw new Exception('Payment ID is required');
    }
    
    // Create payment client
    $client = new PaymentClient();
    
    // Get payment details
    $payment = $client->get($paymentId);
    
    // Return payment status
    echo json_encode([
        'success' => true,
        'status' => $payment->status,
        'status_detail' => $payment->status_detail,
        'date_approved' => $payment->date_approved ?? null
    ]);
    
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
