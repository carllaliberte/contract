#!/usr/bin/env python3
"""Expand iOS .lproj + CFBundleLocalizations and Android values-* to match in-app locales."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IOS_APP = ROOT / "ios" / "App" / "App"
PBX = ROOT / "ios" / "App" / "App.xcodeproj" / "project.pbxproj"
PLIST = IOS_APP / "Info.plist"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

# In-app ids plus en-US (App Store English US) which maps to default "en".
IOS_REGIONS = [
    "en",
    "en-US",
    "en-GB",
    "en-CA",
    "en-AU",
    "fr",
    "fr-CA",
    "es",
    "es-MX",
    "pt-BR",
    "pt",
    "de",
    "it",
    "nl",
    "pl",
    "ru",
    "uk",
    "tr",
    "ja",
    "ko",
    "zh-Hans",
    "zh-Hant",
    "ar",
    "he",
    "hi",
    "bn",
    "id",
    "ms",
    "vi",
    "th",
    "sv",
    "da",
    "nb",
    "fi",
    "cs",
    "ro",
    "hu",
    "el",
    "ca",
    "hr",
    "sk",
    "sl",
]

ANDROID_VALUES = {
    "en-US": "values-en-rUS",
    "en-GB": "values-en-rGB",
    "en-CA": "values-en-rCA",
    "en-AU": "values-en-rAU",
    "fr": "values-fr",
    "fr-CA": "values-fr-rCA",
    "es": "values-es",
    "es-MX": "values-es-rMX",
    "pt-BR": "values-pt-rBR",
    "pt": "values-pt",
    "de": "values-de",
    "it": "values-it",
    "nl": "values-nl",
    "pl": "values-pl",
    "ru": "values-ru",
    "uk": "values-uk",
    "tr": "values-tr",
    "ja": "values-ja",
    "ko": "values-ko",
    "zh-Hans": "values-zh-rCN",
    "zh-Hant": "values-zh-rTW",
    "ar": "values-ar",
    "he": "values-he",
    "hi": "values-hi",
    "bn": "values-bn",
    "id": "values-in",
    "ms": "values-ms",
    "vi": "values-vi",
    "th": "values-th",
    "sv": "values-sv",
    "da": "values-da",
    "nb": "values-nb",
    "fi": "values-fi",
    "cs": "values-cs",
    "ro": "values-ro",
    "hu": "values-hu",
    "el": "values-el",
    "ca": "values-ca",
    "hr": "values-hr",
    "sk": "values-sk",
    "sl": "values-sl",
}

STRINGS_XML = """<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">CreatorFlow</string>
    <string name="title_activity_main">CreatorFlow</string>
    <string name="package_name">com.carllaliberte.creatorflow</string>
    <string name="custom_url_scheme">com.carllaliberte.creatorflow</string>
</resources>
"""

INFOPLIST_STRINGS = '/* Localized */\n"CFBundleDisplayName" = "CreatorFlow";\n"CFBundleName" = "CreatorFlow";\n'


def write_ios_lproj() -> None:
    for region in IOS_REGIONS:
        folder = IOS_APP / f"{region}.lproj"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "InfoPlist.strings").write_text(INFOPLIST_STRINGS, encoding="utf-8")
        print(f"ios {region}.lproj")


def patch_info_plist() -> None:
    text = PLIST.read_text(encoding="utf-8")
    entries = "\n".join(f"\t\t<string>{r}</string>" for r in IOS_REGIONS)
    block = (
        "\t<key>CFBundleLocalizations</key>\n"
        "\t<array>\n"
        f"{entries}\n"
        "\t</array>"
    )
    text, n = re.subn(
        r"\t<key>CFBundleLocalizations</key>\n\t<array>.*?\n\t</array>",
        block,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("failed to patch CFBundleLocalizations")
    PLIST.write_text(text, encoding="utf-8")
    print("patched Info.plist")


def pbx_id(index: int) -> str:
    return f"A11EC{index:03d}1FED79650016851F"


def patch_pbxproj() -> None:
    text = PBX.read_text(encoding="utf-8")

    file_refs = []
    variant_children = []
    for i, region in enumerate(IOS_REGIONS):
        ref = pbx_id(i + 3)  # 003+ matches existing en=003
        quoted = region if re.fullmatch(r"[A-Za-z]+", region) else f'"{region}"'
        path = f"{region}.lproj/InfoPlist.strings"
        path_lit = path if re.fullmatch(r"[A-Za-z./]+", path) else f'"{path}"'
        file_refs.append(
            f"\t\t{ref} /* {region} */ = "
            f"{{isa = PBXFileReference; lastKnownFileType = text.plist.strings; "
            f"name = {quoted}; path = {path_lit}; sourceTree = \"<group>\"; }};"
        )
        variant_children.append(f"\t\t\t\t{ref} /* {region} */,")

    file_ref_block = "\n".join(file_refs) + "\n"
    # Replace the four existing A11EC003-006 file refs with the full set.
    text, n = re.subn(
        r"\t\tA11EC0031FED79650016851F /\* en \*/ = \{isa = PBXFileReference;.*?\n"
        r"(?:\t\tA11EC00[0-9A-F]+1FED79650016851F /\* .*? \*/ = \{isa = PBXFileReference;.*?\n)*",
        file_ref_block,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("failed to patch PBXFileReference locale entries")

    known = ",\n".join(
        f"\t\t\t\t{region if re.fullmatch(r'[A-Za-z]+', region) else chr(34)+region+chr(34)}"
        for region in IOS_REGIONS
    )
    known_block = (
        "\t\t\tknownRegions = (\n"
        f"{known},\n"
        "\t\t\t\tBase,\n"
        "\t\t\t);"
    )
    text, n = re.subn(
        r"\t\t\tknownRegions = \(.*?\n\t\t\t\);",
        known_block,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("failed to patch knownRegions")

    children = "\n".join(variant_children)
    variant_block = (
        "\t\tA11EC0021FED79650016851F /* InfoPlist.strings */ = {\n"
        "\t\t\tisa = PBXVariantGroup;\n"
        "\t\t\tchildren = (\n"
        f"{children}\n"
        "\t\t\t);\n"
        "\t\t\tname = InfoPlist.strings;\n"
        "\t\t\tsourceTree = \"<group>\";\n"
        "\t\t};"
    )
    text, n = re.subn(
        r"\t\tA11EC0021FED79650016851F /\* InfoPlist.strings \*/ = \{.*?\n\t\t\};",
        variant_block,
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("failed to patch InfoPlist.strings variant group")

    PBX.write_text(text, encoding="utf-8")
    print("patched project.pbxproj")


def write_android() -> None:
    for folder in ANDROID_VALUES.values():
        dest = ANDROID_RES / folder
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "strings.xml").write_text(STRINGS_XML, encoding="utf-8")
        print(f"android {folder}")
    # Modern aliases
    for alias, source in (("values-id", "values-in"), ("values-iw", "values-he")):
        dest = ANDROID_RES / alias
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "strings.xml").write_text(STRINGS_XML, encoding="utf-8")
        print(f"android {alias} (alias of {source})")


def main() -> None:
    write_ios_lproj()
    patch_info_plist()
    patch_pbxproj()
    write_android()
    print("native locales ok", len(IOS_REGIONS), "ios regions")


if __name__ == "__main__":
    main()
