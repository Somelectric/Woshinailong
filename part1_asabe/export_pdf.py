"""
使用 PowerPoint COM 把 pptx 转 pdf（离线，无需 LibreOffice）
通过 SaveAs + format=32 走 PDF。
"""
import os, sys
import win32com.client as win32

PPTX = r"c:\projects\机构设计\part1_asabe\slides.pptx"
PDF   = r"c:\projects\机构设计\part1_asabe\slides.pdf"

if not os.path.exists(PPTX):
    print(f"找不到 PPT: {PPTX}")
    sys.exit(1)

ppt = win32.Dispatch("PowerPoint.Application")
try:
    ppt.Visible = 0
except Exception:
    pass

print(f"打开 {PPTX} ...")
# Open(FileName, ReadOnly, Untitled, WithWindow)
pres = ppt.Presentations.Open(PPTX, True, False, False)

print("导出 PDF (SaveAs format=32) ...")
try:
    pres.SaveAs(PDF, 32)  # 32 = ppSaveAsPDF
except Exception as e:
    print(f"SaveAs 失败: {e}")
    print("尝试 ExportAsFixedFormat ...")
    pres.ExportAsFixedFormat(PDF, 32, 0)  # Path, Type, Intent

pres.Close()
ppt.Quit()

if os.path.exists(PDF):
    print(f"OK: {PDF}")
    print(f"大小: {os.path.getsize(PDF) / 1024 / 1024:.1f} MB")
else:
    print("失败：PDF 未生成")
    sys.exit(1)
