<?php
// =============================================
// api/services.php
// =============================================

function getServices(): void {
    $db  = Database::getInstance()->getConnection();
    $sql = "SELECT id, title, description, icon, sort_order
            FROM services
            WHERE is_active = 1
            ORDER BY sort_order ASC";
    $stmt = $db->query($sql);
    $rows = $stmt->fetchAll();
    respond(['success' => true, 'data' => $rows]);
}
