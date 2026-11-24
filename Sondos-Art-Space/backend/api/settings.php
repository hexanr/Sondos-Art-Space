<?php
// =============================================
// api/settings.php
// =============================================

function getSettings(): void {
    $db   = Database::getInstance()->getConnection();
    $rows = $db->query("SELECT setting_key, setting_value FROM site_settings")->fetchAll();

    // تحويل الـ rows لـ key => value object
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    respond(['success' => true, 'data' => $settings]);
}
