<?php
// =============================================
// api/stats.php
// =============================================

function getStats(): void {
    $db   = Database::getInstance()->getConnection();
    $rows = $db->query("SELECT label, value FROM stats ORDER BY sort_order ASC")->fetchAll();
    respond(['success' => true, 'data' => $rows]);
}
