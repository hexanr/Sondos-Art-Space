<?php
// =============================================
// api/contact.php
// =============================================

function sendMessage(): void {
    $body = getBody();

    // التحقق من الحقول المطلوبة
    if (empty($body['name'])) {
        respond(['success' => false, 'message' => 'Name is required.'], 422);
    }
    if (empty($body['email']) || !validateEmail($body['email'])) {
        respond(['success' => false, 'message' => 'Valid email is required.'], 422);
    }
    if (empty($body['message'])) {
        respond(['success' => false, 'message' => 'Message is required.'], 422);
    }

    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare(
        "INSERT INTO contact_messages (name, email, phone, subject, message, service_interest, ip_address)
         VALUES (:name, :email, :phone, :subject, :message, :service_interest, :ip)"
    );
    $stmt->execute([
        ':name'             => sanitize($body['name']),
        ':email'            => sanitize($body['email']),
        ':phone'            => sanitize($body['phone']   ?? ''),
        ':subject'          => sanitize($body['subject'] ?? ''),
        ':message'          => sanitize($body['message']),
        ':service_interest' => sanitize($body['service_interest'] ?? ''),
        ':ip'               => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    respond([
        'success' => true,
        'message' => 'Your message has been sent successfully! I will get back to you soon.'
    ], 201);
}

function getMessages(): void {
    $db   = Database::getInstance()->getConnection();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $stmt = $db->prepare(
        "SELECT id, name, email, phone, subject, service_interest, is_read, created_at
         FROM contact_messages
         ORDER BY created_at DESC
         LIMIT :limit OFFSET :offset"
    );
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $total = $db->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();

    respond([
        'success' => true,
        'data'    => $rows,
        'total'   => (int)$total,
        'page'    => $page,
        'pages'   => (int)ceil($total / $limit),
    ]);
}

function deleteMessage(int $id): void {
    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("DELETE FROM contact_messages WHERE id = :id");
    $stmt->execute([':id' => $id]);
    respond(['success' => true, 'message' => 'تم حذف الرسالة.']);
}

function markMessageRead(int $id): void {
    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("UPDATE contact_messages SET is_read = 1 WHERE id = :id");
    $stmt->execute([':id' => $id]);
    respond(['success' => true, 'message' => 'تم تحديد الرسالة كمقروءة.']);
}