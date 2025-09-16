<?php
require_once __DIR__ . '/vendor/autoload.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\RequestOptions;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

// Configurar credenciais (use seu token real)
MercadoPagoConfig::setAccessToken("APP_USR-6493240016618428-080712-7ed5d6b7842b265508c0411fa147e896-1782895287");

// Teste: criar cliente de pagamento
$client = new PaymentClient();

$request_options = new RequestOptions();
$request_options
->setCustomHeaders(["X-Idempotency-Key: " . uniqid()]);
// 2. Cria o cliente de pagamentos
$client = new PaymentClient();

try {
    // 3. Cria um pagamento PIX
    $payment = $client->create([
        "transaction_amount" => 10.00,
        "description" => "Pedido #1234 - Raspagreen",
        "payment_method_id" => "pix",
        "payer" => [
            "email" => "comprador@email.com"
        ]
    ]);

    // 4. Exibe dados importantes
    echo "Pagamento ID: " . $payment->id . PHP_EOL;
    echo "Status: " . $payment->status . PHP_EOL;

    // Payload para copiar e colar
    echo "Payload Pix: " . $payment->point_of_interaction->transaction_data->qr_code . PHP_EOL;

    // QR Code em Base64 → salva como imagem
    $qrBase64 = $payment->point_of_interaction->transaction_data->qr_code_base64;
    file_put_contents("pix_qrcode.png", base64_decode($qrBase64));

    echo "QR Code salvo em: pix_qrcode.png" . PHP_EOL;

} catch (MPApiException $e) {
    echo "Erro API: " . $e->getMessage();
    var_dump($e->getApiResponse()->getContent());
} catch (Exception $e) {
    echo "Erro geral: " . $e->getMessage();
}

