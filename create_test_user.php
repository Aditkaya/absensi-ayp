<?php
$mysqli = new mysqli('127.0.0.1', 'root', '', 'aypsis');
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// 1. Define test employee and user details
$nik = 'TEST12345';
$username = 'testuser';
$password = 'password123'; // plaintext
$hashed_password = password_hash($password, PASSWORD_BCRYPT);
$nama_lengkap = 'Test Employee User';
$nama_panggilan = 'Test';
$divisi = 'IT Development';
$pekerjaan = 'Software Engineer';
$email = 'testuser@aypsis.com';

// 2. Check if employee already exists
$stmt = $mysqli->prepare("SELECT id FROM karyawans WHERE nik = ?");
$stmt->bind_param("s", $nik);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    $karyawan = $res->fetch_assoc();
    $karyawan_id = $karyawan['id'];
    echo "Employee with NIK $nik already exists with ID: $karyawan_id\n";
} else {
    // Insert new employee
    $stmt_ins = $mysqli->prepare("INSERT INTO karyawans (nik, nama_lengkap, nama_panggilan, divisi, pekerjaan, email, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
    $status = 'active';
    $stmt_ins->bind_param("ssssss", $nik, $nama_lengkap, $nama_panggilan, $divisi, $pekerjaan, $email);
    if ($stmt_ins->execute()) {
        $karyawan_id = $mysqli->insert_id;
        echo "Successfully created test employee with NIK $nik. ID: $karyawan_id\n";
    } else {
        die("Failed to create employee: " . $mysqli->error);
    }
}

// 3. Check if user already exists
$stmt = $mysqli->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    $user = $res->fetch_assoc();
    echo "User with username '$username' already exists with ID: {$user['id']}\n";
    
    // Update password just in case
    $stmt_up = $mysqli->prepare("UPDATE users SET password = ?, is_approved = 1, status = 'active', karyawan_id = ? WHERE id = ?");
    $stmt_up->bind_param("sii", $hashed_password, $karyawan_id, $user['id']);
    $stmt_up->execute();
    echo "Updated user password to '$password'.\n";
} else {
    // Insert new user
    $role = 'user';
    $is_approved = 1;
    $status = 'active';
    $stmt_ins = $mysqli->prepare("INSERT INTO users (username, password, role, is_approved, status, karyawan_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt_ins->bind_param("sssiis", $username, $hashed_password, $role, $is_approved, $status, $karyawan_id);
    if ($stmt_ins->execute()) {
        echo "Successfully created test user.\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
    } else {
        die("Failed to create user: " . $mysqli->error);
    }
}

// 4. Update the user_id in karyawans if needed
$stmt_up_k = $mysqli->prepare("UPDATE karyawans SET user_id = (SELECT id FROM users WHERE karyawan_id = karyawans.id LIMIT 1) WHERE id = ?");
$stmt_up_k->bind_param("i", $karyawan_id);
$stmt_up_k->execute();

$mysqli->close();
echo "Done!\n";
