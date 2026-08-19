// src/log.rs — 零依赖分级日志宏
// 通过 VISAGO_LOG 环境变量控制级别：debug / info / warn（默认）
// 不打印任何 Key 或用户隐私字段

use std::sync::OnceLock;

static LOG_LEVEL: OnceLock<u8> = OnceLock::new();

pub fn get_log_level() -> u8 {
    *LOG_LEVEL.get_or_init(|| {
        match std::env::var("VISAGO_LOG").as_deref() {
            Ok("debug") => 0, // debug + info + warn + error
            Ok("info") => 1,  // info + warn + error
            _ => 2,           // 默认只输出 warn 及以上
        }
    })
}

/// 关键生命周期事件（如服务启动、编译完成、Vite 地址），始终输出
#[macro_export]
macro_rules! log_event {
    ($($arg:tt)*) => { println!($($arg)*); };
}

/// 错误信息，始终输出
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => { eprintln!($($arg)*); };
}

/// 警告信息，VISAGO_LOG ≤ warn 时输出（默认级别）
#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => { if $crate::log::get_log_level() <= 2 { println!($($arg)*); } };
}

/// 常规信息，VISAGO_LOG ≤ info 时输出
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => { if $crate::log::get_log_level() <= 1 { println!($($arg)*); } };
}

/// 调试明细，VISAGO_LOG=debug 时输出
#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => { if $crate::log::get_log_level() <= 0 { println!($($arg)*); } };
}