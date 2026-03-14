#!/usr/bin/env python3
"""
プレースホルダー素材生成スクリプト
アセット未配置でもアプリが正常動作するよう、
最低限のPNGファイルを生成します。
"""
import os
import struct
import zlib

def create_dirs():
    dirs = [
        'assets/background',
        'assets/characters',
        'assets/effects',
        'assets/icons',
        'assets/audio',
        'assets/audio/character',
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print("✓ ディレクトリ作成完了")

def make_png(width, height, r, g, b, a=255):
    """シンプルな単色PNGを生成"""
    def pack_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    # RGBA uses color type 6
    ihdr_data = struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0])
    ihdr = pack_chunk(b'IHDR', ihdr_data)

    # IDAT
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter type
        for x in range(width):
            raw += bytes([r, g, b, a])
    compressed = zlib.compress(raw, 9)
    idat = pack_chunk(b'IDAT', compressed)

    # IEND
    iend = pack_chunk(b'IEND', b'')

    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend

def write_png(path, width, height, r, g, b, a=255):
    if not os.path.exists(path):
        with open(path, 'wb') as f:
            f.write(make_png(width, height, r, g, b, a))
        print(f"  生成: {path}")
    else:
        print(f"  スキップ（既存）: {path}")

def create_placeholders():
    # アイコン
    write_png('assets/icons/icon-192.png', 192, 192, 233, 30, 99)
    write_png('assets/icons/icon-512.png', 512, 512, 233, 30, 99)
    write_png('assets/icons/icon-1024.png', 1024, 1024, 233, 30, 99)

    # キャラクター（9種・透過）
    write_png('assets/characters/character-default.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt1.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt2.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt3.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt4.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt5.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt6.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt7.png', 200, 300, 244, 143, 177, 0)
    write_png('assets/characters/character-alt8.png', 200, 300, 244, 143, 177, 0)

    # エフェクト（桜の花びら3種）
    write_png('assets/effects/quest-clear-stamp.png', 200, 200, 233, 30, 99, 0)
    write_png('assets/effects/sakura-petal.png',   20, 20, 255, 150, 180)
    write_png('assets/effects/sakura-petal01.png', 20, 20, 255, 180, 200)
    write_png('assets/effects/sakura-petal02.png', 20, 20, 240, 120, 160)

    # 背景（PC用・スマホ用）
    write_png('assets/background/background.png',   100, 100, 26, 5, 16)
    write_png('assets/background/background01.png', 100, 100, 16, 3, 26)

    print("✓ プレースホルダー画像生成完了")

def create_placeholder_audio():
    """空のMP3ファイル（1バイト）を生成"""
    audio_files = [
        'assets/audio/main-bgm.mp3',
        'assets/audio/quest-clear.mp3',
        'assets/audio/subquest-clear.mp3',
        'assets/audio/level-up.mp3',
    ] + [f'assets/audio/character/voice{i:02d}.mp3' for i in range(1, 17)]
    for f in audio_files:
        if not os.path.exists(f):
            with open(f, 'wb') as fp:
                fp.write(b'')  # 空ファイル
            print(f"  生成: {f}")
        else:
            print(f"  スキップ（既存）: {f}")
    print("✓ 音声プレースホルダー生成完了")

if __name__ == '__main__':
    print("=== みこクエスト プレースホルダー素材生成 ===\n")
    create_dirs()
    create_placeholders()
    create_placeholder_audio()
    print("\n完了！実際の素材に差し替えてください。")
