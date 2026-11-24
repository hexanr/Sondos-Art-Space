<?php
// =============================================
// api/portfolio.php — مع دعم الصور المتعددة
// =============================================

// ── مسار رفع الصور ──
define('UPLOAD_DIR', __DIR__ . '/../../uploads/portfolio/');
define('UPLOAD_URL', 'uploads/portfolio/');

// ── حفظ صورة (base64 أو URL) ──
function saveImage(string $raw, int $portfolioId, int $index = 0): string {
    // إذا كانت URL عادية
    if (filter_var($raw, FILTER_VALIDATE_URL)) {
        return $raw;
    }
    // إذا كانت base64
    if (preg_match('/^data:image\/(\w+);base64,/', $raw, $m)) {
        $ext  = strtolower($m[1] === 'jpeg' ? 'jpg' : $m[1]);
        $data = base64_decode(substr($raw, strpos($raw, ',') + 1));
        if (!$data) return '';

        if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

        $filename = "p{$portfolioId}_{$index}_" . uniqid() . ".{$ext}";
        file_put_contents(UPLOAD_DIR . $filename, $data);
        return UPLOAD_URL . $filename;
    }
    return '';
}

// ── جلب الأعمال ──
function getPortfolio(): void {
    $db = Database::getInstance()->getConnection();

    $category = $_GET['category'] ?? null;
    $featured  = $_GET['featured']  ?? null;

    $sql    = "SELECT id, title, title_ar, description, category, image_path,
                      client_name, year, is_featured
               FROM portfolio WHERE is_active = 1";
    $params = [];

    if ($category) {
        $sql .= " AND category = :category";
        $params[':category'] = sanitize($category);
    }
    if ($featured !== null) {
        $sql .= " AND is_featured = :featured";
        $params[':featured'] = (int)$featured;
    }
    $sql .= " ORDER BY sort_order ASC, created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // جلب الصور لكل عمل
    foreach ($rows as &$row) {
        $imgStmt = $db->prepare(
            "SELECT id, image_path, sort_order FROM portfolio_images
             WHERE portfolio_id = :pid ORDER BY sort_order ASC"
        );
        $imgStmt->execute([':pid' => $row['id']]);
        $row['images'] = $imgStmt->fetchAll();

        // إذا مفيش صور في الجدول الجديد، استخدم image_path القديم
        if (empty($row['images']) && !empty($row['image_path'])) {
            $row['images'] = [['id' => 0, 'image_path' => $row['image_path'], 'sort_order' => 0]];
        }
        // أول صورة = الغلاف
        $row['cover'] = $row['images'][0]['image_path'] ?? null;
    }

    respond(['success' => true, 'data' => $rows, 'count' => count($rows)]);
}

// ── جلب عمل واحد ──
function getPortfolioItem(int $id): void {
    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("SELECT * FROM portfolio WHERE id = :id AND is_active = 1");
    $stmt->execute([':id' => $id]);
    $row  = $stmt->fetch();

    if (!$row) {
        respond(['success' => false, 'message' => 'Item not found.'], 404);
    }

    // جلب الصور
    $imgStmt = $db->prepare(
        "SELECT id, image_path, sort_order FROM portfolio_images
         WHERE portfolio_id = :pid ORDER BY sort_order ASC"
    );
    $imgStmt->execute([':pid' => $id]);
    $row['images'] = $imgStmt->fetchAll();

    respond(['success' => true, 'data' => $row]);
}

// ── إضافة عمل جديد ──
function createPortfolioItem(): void {
    $body = getBody();

    if (empty($body['title'])) {
        respond(['success' => false, 'message' => 'العنوان مطلوب.'], 422);
    }
    if (empty($body['category'])) {
        respond(['success' => false, 'message' => 'الكاتيقوري مطلوب.'], 422);
    }
    if (empty($body['year'])) {
        respond(['success' => false, 'message' => 'السنة مطلوبة.'], 422);
    }

    $db = Database::getInstance()->getConnection();

    // إدراج السجل أولاً
    $stmt = $db->prepare(
        "INSERT INTO portfolio
           (title, title_ar, description, category, client_name, year, is_featured, sort_order)
         VALUES
           (:title, :title_ar, :description, :category, :client_name, :year, :is_featured, :sort_order)"
    );
    $stmt->execute([
        ':title'       => sanitize($body['title']),
        ':title_ar'    => sanitize($body['title_ar']    ?? ''),
        ':description' => sanitize($body['description'] ?? ''),
        ':category'    => sanitize($body['category']),
        ':client_name' => sanitize($body['client_name'] ?? ''),
        ':year'        => (int)$body['year'],
        ':is_featured' => (int)($body['is_featured'] ?? 0),
        ':sort_order'  => (int)($body['sort_order']  ?? 0),
    ]);
    $portfolioId = (int)$db->lastInsertId();

    // ── معالجة الصور المتعددة ──
    $savedPaths = [];
    $images = $body['images'] ?? [];          // مصفوفة من base64 أو URLs
    if (!is_array($images)) $images = [];

    // دعم الصورة المفردة القديمة
    if (empty($images) && !empty($body['image'])) {
        $images = [$body['image']];
    }

    foreach ($images as $idx => $imgRaw) {
        if (empty($imgRaw)) continue;
        $path = saveImage($imgRaw, $portfolioId, $idx);
        if (!$path) continue;

        $iStmt = $db->prepare(
            "INSERT INTO portfolio_images (portfolio_id, image_path, sort_order)
             VALUES (:pid, :path, :ord)"
        );
        $iStmt->execute([':pid' => $portfolioId, ':path' => $path, ':ord' => $idx]);
        $savedPaths[] = $path;
    }

    // تحديث image_path (الغلاف) في جدول portfolio
    if (!empty($savedPaths)) {
        $db->prepare("UPDATE portfolio SET image_path = :p WHERE id = :id")
           ->execute([':p' => $savedPaths[0], ':id' => $portfolioId]);
    }

    respond([
        'success' => true,
        'message' => 'تم إضافة العمل بنجاح.',
        'id'      => $portfolioId,
        'images'  => $savedPaths,
    ], 201);
}

// ── حذف عمل ──
function deletePortfolioItem(int $id): void {
    $db   = Database::getInstance()->getConnection();
    $stmt = $db->prepare("UPDATE portfolio SET is_active = 0 WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        respond(['success' => false, 'message' => 'Item not found.'], 404);
    }
    respond(['success' => true, 'message' => 'تم حذف العمل.']);
}