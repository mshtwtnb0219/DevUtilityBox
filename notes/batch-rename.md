# 一括リネームツール

## 動作確認用テストパターン

以下のテストパターンで動作確認を行ってください：

### 1. 文字列置換テスト

**対象ファイル例：**

```plaintext
old_document.txt
old_image.jpg
old_data.csv
```

**検索文字列：** old**置換後文字列：** new**変更前：** old_document.txt**変更後：** new_document.txt

### 2. 接頭辞追加テスト

**対象ファイル例：**

```plaintext
report.pdf
data.xlsx
image.png
```

**接頭辞：** 2024_**変更前：** report.pdf**変更後：** 2024_report.pdf

### 3. 接尾辞追加テスト

**対象ファイル例：**

```plaintext
document.txt
photo.jpg
backup.zip
```

**接尾辞：** _v2**変更前：** document.txt**変更後：** document_v2.txt

### 4. 大文字変換テスト

**対象ファイル例：**

```plaintext
readme.txt
config.json
setup.exe
```

**変換方法：** 大文字に変換**変更前：** readme.txt**変更後：** README.TXT

### 5. 小文字変換テスト

**対象ファイル例：**

```plaintext
README.TXT
CONFIG.JSON
SETUP.EXE
```

**変換方法：** 小文字に変換**変更前：** README.TXT**変更後：** readme.txt

### 6. タイトルケース変換テスト

**対象ファイル例：**

```plaintext
user manual.pdf
quick start guide.txt
installation notes.md
```

**変換方法：** タイトルケースに変換**変更前：** user manual.pdf**変更後：** User Manual.pdf

### 7. 連番リネームテスト

**対象ファイル例：**

```plaintext
IMG_001.jpg
IMG_002.jpg
IMG_003.jpg
```

**接頭辞：** photo**開始番号：** 1**桁数：** 3**変更前：** IMG_001.jpg**変更後：** photo_001.jpg

### 8. 日本語ファイル名テスト

**対象ファイル例：**

```plaintext
古いファイル.txt
古い画像.jpg
古いデータ.csv
```

**検索文字列：** 古い**置換後文字列：** 新しい**変更前：** 古いファイル.txt**変更後：** 新しいファイル.txt

### 9. ディレクトリリネームテスト

**対象ディレクトリ例：**

```plaintext
old_folder/
temp_data/
backup_files/
```

**検索文字列：** old**置換後文字列：** new**オプション：** ディレクトリを対象に含める**変更前：** old_folder**変更後：** new_folder

### 10. 拡張子変換テスト

**対象ファイル例：**

```plaintext
document.TXT
image.JPG
data.CSV
```

**変換方法：** 小文字に変換**オプション：** 拡張子も変換対象に含める**変更前：** document.TXT**変更後：** document.txt  
