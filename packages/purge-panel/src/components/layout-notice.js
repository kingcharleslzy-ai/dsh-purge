// 布局/换包提示：磁盘上有归档不等于当前进程已加载。从旧设置页迁移过来（page.js 已删除）。
import { h } from "../shared/react.js";

const HANDOFF = {
  not_scheduled: "尚未应用：点「应用」后才会安排换包",
  archive_reappeared: "归档再次出现，旧换包记录不代表当前已完成",
  backup_missing: "原归档备份缺失，请检查诊断",
  unknown_target: "目标实例未确定",
  unreadable: "换包记录不可读，请检查诊断",
  starting: "助手启动中（尚未确认就绪）",
  ready: "助手已就绪",
  waiting_for_quit: "等待完整退出（macOS ⌘Q / Windows 系统托盘）",
  waiting_for_unlock: "等待归档解锁",
  moving: "正在保留原归档",
  complete: "换包完成，请手动打开 DSH",
  already_unsealed: "归档已移走，请手动打开 DSH",
  failed: "失败，请查看诊断并按恢复文档操作",
  expired: "等待超时，请重新应用或按恢复文档操作",
  helper_stopped: "助手意外结束，请重新应用或按恢复文档操作",
};

export function LayoutNotice({ info }) {
  if (!info || (!info.asar_still_sealed && !info.host_layout)) return null;
  if (info.host_layout && info.host_layout.family === "tauri") {
    return h(
      "p",
      { className: "dshpp-note", role: "status" },
      info.host_layout.note,
    );
  }
  const sealed = info.asar_still_sealed === true;
  const note =
    (info.host_layout && info.host_layout.note) ||
    "目标磁盘仍有 app.asar；当前进程加载来源尚未确认。";
  const handoff = info.asar_handoff
    ? " 换包状态：" +
      (HANDOFF[info.asar_handoff.phase] || info.asar_handoff.phase) +
      "。"
    : "";
  const failure = info.asar_handoff && info.asar_handoff.error;
  const detail =
    info.asar_handoff && info.asar_handoff.detail
      ? " 详情：" +
        info.asar_handoff.detail +
        (failure && failure.win32_code != null
          ? "（Windows 错误 " + failure.win32_code + "）"
          : "")
      : "";
  const layout = info.host_layout;
  if (
    info.ok !== false &&
    info.surface === "web" &&
    layout &&
    layout.disk &&
    layout.disk.surface === "web" &&
    layout.state === "unknown_runtime" &&
    layout.process &&
    layout.process.entry_layout === "unknown" &&
    layout.process.matches_target === null &&
    layout.disk.archive_exists === null &&
    layout.disk.unpacked_exists === null &&
    !info.desktop_exe &&
    !info.desktop_install &&
    !sealed &&
    !(layout.errors && layout.errors.length) &&
    info.asar_handoff &&
    info.asar_handoff.phase === "unknown_target" &&
    !info.asar_handoff.error &&
    !info.asar_handoff.detail
  ) {
    return h(
      "details",
      { className: "dshpp-layout-details" },
      h("summary", null, "换包状态：不适用（Web 宿主）"),
      h(
        "p",
        { className: "dshpp-note" },
        "Web 服务无需桌面归档换包。原始诊断：",
        layout.state,
        " / ",
        info.asar_handoff.phase,
      ),
    );
  }
  const confirmed =
    layout &&
    layout.state === "unpacked_entry" &&
    layout.process &&
    layout.process.matches_target === true &&
    layout.disk &&
    layout.disk.archive_exists === false;
  const diskNote =
    layout && layout.disk && layout.disk.archive_exists === true
      ? " 目标磁盘仍有 app.asar。"
      : "";
  if (sealed || !confirmed) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      note,
      diskNote,
      handoff,
      detail,
    );
  }
  return h(
    "details",
    { className: "dshpp-layout-details" },
    h("summary", null, "✓ 已从解包目录启动（换包完成）"),
    h("p", { className: "dshpp-note" }, note, diskNote, handoff, detail),
  );
}
