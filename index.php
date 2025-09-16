<?php
// Exibir erros em desenvolvimento para facilitar diagnóstico
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Garantir que o autoload do Composer existe
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode([
        'error' => 'Composer autoload não encontrado',
        'details' => 'Execute "composer require mercadopago/dx-php" na raiz do projeto para instalar dependências.'
    ]);
    exit;
}
require_once $autoload;

use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;

// Configurar credenciais (use seu token real)
\MercadoPago\MercadoPagoConfig::setAccessToken("APP_USR-6493240016618428-080712-7ed5d6b7842b265508c0411fa147e896-1782895287");

// =============================
// API simples para PIX (JSON)
// =============================
// CORS básico (mesma origem normalmente não precisa, mas deixamos seguro)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Roteamento por querystring: ?action=pix_create ou ?action=pix_status&id=...
$action = isset($_GET['action']) ? $_GET['action'] : null;
if ($action === 'pix_create') {
    header('Content-Type: application/json');
    try {
        // Suportar JSON (POST), form-encoded (POST) e fallback por GET
        $amount = 0.5;
        $description = 'Raspadinha Centavo da Sorte';

        // 1) Tentar JSON
        $raw = file_get_contents('php://input');
        if ($raw) {
            $data = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                if (isset($data['amount'])) $amount = floatval($data['amount']);
                if (isset($data['description'])) $description = $data['description'];
            }
        }

        // 2) Tentar application/x-www-form-urlencoded
        if (isset($_POST['amount'])) $amount = floatval($_POST['amount']);
        if (isset($_POST['description'])) $description = $_POST['description'];

        // 3) Fallback GET (debug)
        if (isset($_GET['amount'])) $amount = floatval($_GET['amount']);
        if (isset($_GET['description'])) $description = $_GET['description'];

        $client = new PaymentClient();
        $payment = $client->create([
            'transaction_amount' => $amount,
            'description' => $description,
            'payment_method_id' => 'pix',
            'payer' => [
                // Para PIX imediato, o e-mail é suficiente. Dados adicionais podem ser usados se necessário.
                'email' => 'comprador@example.com'
            ]
        ]);

        $tx = $payment->point_of_interaction->transaction_data ?? null;
        echo json_encode([
            'id' => $payment->id,
            'status' => $payment->status,
            'qr_code' => $tx ? ($tx->qr_code ?? null) : null,
            'qr_code_base64' => $tx ? ($tx->qr_code_base64 ?? null) : null,
            'ticket_url' => $tx ? ($tx->ticket_url ?? null) : null,
            // Nem sempre o MP retorna expiração no campo acima; deixamos null se não houver
            'expiration_time' => $tx && isset($tx->expiration_time) ? $tx->expiration_time : null
        ]);
    } catch (MPApiException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao criar pagamento PIX', 'details' => $e->getMessage(), 'mp' => $e->getApiResponse()->getContent()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro inesperado', 'details' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'pix_status' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    try {
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Parâmetro id é obrigatório']);
            exit;
        }
        $client = new PaymentClient();
        $payment = $client->get($id);
        echo json_encode([
            'id' => $payment->id,
            'status' => $payment->status,
            'status_detail' => $payment->status_detail
        ]);
    } catch (MPApiException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao consultar PIX', 'details' => $e->getMessage(), 'mp' => $e->getApiResponse()->getContent()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro inesperado', 'details' => $e->getMessage()]);
    }
    exit;
}

// Caso não seja uma chamada de API, opcionalmente você pode renderizar uma página ou apenas encerrar.
header('Content-Type: application/json');
echo json_encode(['message' => 'API PIX disponível. Use ?action=pix_create (POST) ou ?action=pix_status&id=... (GET).']);
exit;

