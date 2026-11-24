<?php
// =============================================
// api/auth.php — Admin Authentication
// =============================================

function adminLogin(): void {
    $body = getBody();
    $username = $body['username'] ?? '';
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        respond(['success' => false, 'message' => 'بيانات ناقصة'], 422);
    }

    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("SELECT * FROM admin WHERE username = :u LIMIT 1");
    $stmt->execute([':u' => $username]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password'])) {
        respond(['success' => false, 'message' => 'اسم المستخدم أو كلمة المرور غلط'], 401);
    }

    // Simple token (في الإنتاج استخدم JWT)
    $token = bin2hex(random_bytes(32));

    respond([
        'success' => true,
        'token'   => $token,
        'user'    => [
            'id'       => $admin['id'],
            'username' => $admin['username'],
            'email'    => $admin['email'],
        ]
    ]);
}
