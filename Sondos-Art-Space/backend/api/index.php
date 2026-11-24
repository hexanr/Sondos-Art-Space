<?php
// =============================================
// api/index.php — Router الرئيسي
// =============================================
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── دوال مساعدة ──────────────────────────────
function respond($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
function sanitize(string $str): string {
    return htmlspecialchars(strip_tags(trim($str)));
}
function validateEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// ── التحقق من الـ Token (للمسارات المحمية) ──
function requireAuth(): void {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        respond(['success' => false, 'message' => 'غير مصرح.'], 401);
    }
    $token = trim(substr($auth, 7));
    if (empty($token) || $token === 'demo-token') {
        // demo-token مسموح لوضع التجربة
        if ($token !== 'demo-token') {
            respond(['success' => false, 'message' => 'Token غير صالح.'], 401);
        }
    }
    // في الإنتاج: تحقق من الـ token في الداتا بيز
}

// ── الراوتر ──────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = trim($uri, '/');
$parts  = explode('/', $uri);

// استخراج المسار بعد "api"
$apiIdx = array_search('api', $parts);
if ($apiIdx === false) {
    respond(['success' => false, 'message' => 'Endpoint not found.'], 404);
}
$segments = array_slice($parts, $apiIdx); // ['api','portfolio','5'] مثلاً
$seg1 = $segments[1] ?? '';              // portfolio
$seg2 = $segments[2] ?? '';              // 5  (اختياري)

switch (true) {

    // ── Auth ──
    case $seg1 === 'login' && $method === 'POST':
        require __DIR__ . '/auth.php'; adminLogin(); break;

    // ── Health ──
    case $seg1 === 'health':
        respond(['success' => true, 'status' => 'ok', 'time' => date('Y-m-d H:i:s')]); break;

    // ── Contact (عام — لا يحتاج auth) ──
    case $seg1 === 'contact' && $method === 'POST':
        require __DIR__ . '/contact.php'; sendMessage(); break;

    // ── Messages (محمية) ──
    case $seg1 === 'messages' && $method === 'GET':
        requireAuth();
        require __DIR__ . '/contact.php'; getMessages(); break;

    case $seg1 === 'messages' && $method === 'DELETE' && $seg2 !== '':
        requireAuth();
        require __DIR__ . '/contact.php'; deleteMessage((int)$seg2); break;

    case $seg1 === 'messages' && $method === 'PUT' && $seg2 !== '':
        requireAuth();
        require __DIR__ . '/contact.php'; markMessageRead((int)$seg2); break;

    // ── Portfolio ──
    case $seg1 === 'portfolio' && $method === 'GET' && $seg2 === '':
        getPortfolioPublic(); break;

    case $seg1 === 'portfolio' && $method === 'GET' && $seg2 !== '':
        require __DIR__ . '/portfolio.php'; getPortfolioItem((int)$seg2); break;

    case $seg1 === 'portfolio' && $method === 'POST':
        requireAuth();
        require __DIR__ . '/portfolio.php'; createPortfolioItem(); break;

    case $seg1 === 'portfolio' && $method === 'DELETE' && $seg2 !== '':
        requireAuth();
        require __DIR__ . '/portfolio.php'; deletePortfolioItem((int)$seg2); break;

    // ── Services ──
    case $seg1 === 'services' && $method === 'GET':
        require __DIR__ . '/services.php'; getServices(); break;

    // ── Stats ──
    case $seg1 === 'stats' && $method === 'GET':
        require __DIR__ . '/stats.php'; getStats(); break;

    // ── Settings ──
    case $seg1 === 'settings' && $method === 'GET':
        require __DIR__ . '/settings.php'; getSettings(); break;

    default:
        respond(['success' => false, 'message' => "Endpoint /$seg1 not found."], 404);
}

// دالة للموقع العام (بدون auth)
function getPortfolioPublic(): void {
    require __DIR__ . '/portfolio.php'; getPortfolio();
}