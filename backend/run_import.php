<?php
/**
 * Run SQL imports for Option A:
 * - Import database.sql (schema, tables, defaults)
 * - Execute create_admin.sql (admin user)
 *
 * Safe behaviors:
 * - Executes statements sequentially
 * - Skips comments
 * - Handles SELECT statements separately to print results
 */
	error_reporting(E_ALL);
	ini_set('display_errors', '1');

	echo "== Option A: Import database.sql and create_admin.sql ==\n";

	require_once __DIR__ . '/api/config.php';

	$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
	$options = [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES => false,
		PDO::ATTR_TIMEOUT => 30
	];

	function splitSqlStatements($sql) {
		// Remove BOM
		$sql = preg_replace('/^\xEF\xBB\xBF/', '', $sql);
		// Normalize line endings
		$sql = str_replace(["\r\n", "\r"], "\n", $sql);
		// Remove /** */ comments
		$sql = preg_replace('#/\*.*?\*/#s', '', $sql);
		// Remove -- and # comments
		$lines = explode("\n", $sql);
		$clean = [];
		foreach ($lines as $line) {
			$trim = trim($line);
			if ($trim === '') continue;
			if (strpos($trim, '--') === 0) continue;
			if (strpos($trim, '#') === 0) continue;
			$clean[] = $line;
		}
		$sql = implode("\n", $clean);
		// Split by semicolons not inside quotes
		$statements = [];
		$current = '';
		$inSingle = false;
		$inDouble = false;
		$len = strlen($sql);
		for ($i = 0; $i < $len; $i++) {
			$ch = $sql[$i];
			$prev = $i > 0 ? $sql[$i - 1] : '';
			if ($ch === "'" && $prev !== '\\' && !$inDouble) {
				$inSingle = !$inSingle;
			}
			if ($ch === '"' && $prev !== '\\' && !$inSingle) {
				$inDouble = !$inDouble;
			}
			if ($ch === ';' && !$inSingle && !$inDouble) {
				$statements[] = trim($current);
				$current = '';
			} else {
				$current .= $ch;
			}
		}
		$current = trim($current);
		if ($current !== '') $statements[] = $current;
		return array_filter($statements, function($s) {
			return trim($s) !== '';
		});
	}

	// NEW: Try to resolve file paths from common locations
	function resolveFile($filename, $baseDir) {
		$paths = [
			$baseDir . DIRECTORY_SEPARATOR . $filename,
			$baseDir . DIRECTORY_SEPARATOR . 'IONOS' . DIRECTORY_SEPARATOR . $filename,
			dirname($baseDir) . DIRECTORY_SEPARATOR . 'IONOS' . DIRECTORY_SEPARATOR . $filename,
		];
		foreach ($paths as $p) {
			if (file_exists($p)) return $p;
		}
		echo "[ERROR] File not found for $filename. Attempted paths:\n";
		foreach ($paths as $p) {
			echo " - $p\n";
		}
		return null;
	}

	function runSqlFile(PDO $pdo, $path) {
		if (!file_exists($path)) {
			echo "[ERROR] File not found: $path\n";
			return false;
		}
		$sql = file_get_contents($path);
		$stmts = splitSqlStatements($sql);
		echo "Executing " . count($stmts) . " statements from $path ...\n";
		$ok = 0; $fail = 0;
		foreach ($stmts as $idx => $stmt) {
			try {
				if (preg_match('/^\s*SELECT/i', $stmt)) {
					$q = $pdo->query($stmt);
					$rows = $q->fetchAll();
					echo "[SELECT #$idx] Rows: " . count($rows) . "\n";
					if (!empty($rows)) {
						foreach ($rows as $r) {
							echo '  - ' . json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
						}
					}
				} else {
					$pdo->exec($stmt);
					echo "[OK #$idx] " . substr($stmt, 0, 60) . "...\n";
				}
				$ok++;
			} catch (Exception $e) {
				echo "[FAIL #$idx] " . $e->getMessage() . "\n";
				$fail++;
			}
		}
		echo "Completed: OK=$ok, FAIL=$fail for $path\n";
		return $fail === 0;
	}

	try {
		$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
		echo "Connected to MySQL successfully.\n";

		$baseDir = __DIR__;
		$databaseSql = resolveFile('database.sql', $baseDir);
		$createAdminSql = resolveFile('create_admin.sql', $baseDir);

		$ok1 = $databaseSql ? runSqlFile($pdo, $databaseSql) : false;
		$ok2 = $createAdminSql ? runSqlFile($pdo, $createAdminSql) : false;

		if ($ok1 && $ok2) {
			echo "== Option A import finished successfully ==\n";
		} else {
			echo "== Option A import finished with errors ==\n";
		}

		// Quick verification
		echo "Verifying admin user...\n";
		$stmt = $pdo->prepare("SELECT id, email, role, is_active, is_verified FROM users WHERE email = ? LIMIT 1");
		$stmt->execute(['admin@agria-rouen.fr']);
		$admin = $stmt->fetch();
		if ($admin) {
			echo "Admin found: " . json_encode($admin, JSON_UNESCAPED_UNICODE) . "\n";
			if ((int)$admin['is_verified'] === 0) {
				echo "Hint: L'admin a is_verified=0. Exécutez create_admin.php pour le mettre à jour (role=admin, is_active=1, is_verified=1, mot de passe=admin123).\n";
			}
		} else {
			echo "Admin NOT found after import.\n";
		}

	} catch (Exception $e) {
		echo "[ERROR] " . $e->getMessage() . "\n";
	}