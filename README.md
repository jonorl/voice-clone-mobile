# Voice Clone Mobile

Mobile companion to the [Voice Clone web project](https://github.com/jonorl/voice-clone) - AI-powered **Argentinean Spanish voice cloning** using **XTTS v2**, fine-tuned to replicate a specific voice profile with high naturalness and clarity.

Built with **React Native** and **Expo 54**, this app connects to the same Hugging Face Space backend as the web version, providing a native mobile interface for speech synthesis on Android.

---

## Demo

A prebuilt APK for Android is available under Releases. Download and install it directly on your device to try the app without building from source.

---

## How to Install
 
1. Go to the [Releases](https://github.com/jonorl/voice-clone-mobile/releases/tag/Android) page and download the latest `app-release.apk`
2. Transfer the file to your Android device if downloaded on a computer
3. On your device, open the APK file to install it - you may be prompted to allow installation from unknown sources, which can be enabled under **Settings → Security → Install unknown apps**
4. Once installed, open **VoiceClone** from your app drawer
> Requires Android 10 or higher.

## Key Features

* **High-quality Spanish synthesis** using a fine-tuned XTTS v2 model
* **Near real-time generation** for short and medium-length texts
* **Advanced controls** (temperature, top_p, top_k) to shape voice output
* **Reproducible results** via deterministic seeding
* **Native audio playback** with haptic feedback
* **Share / Save** generated audio directly from the app

---

## Related

* **Web version**: [github.com/jonorl/voice-clone](https://github.com/jonorl/voice-clone)
* **Live demo**: available via the Hugging Face Space linked in the web repo

---

## How It Works

The app communicates with a Hugging Face Space running **Coqui XTTS v2**, fine-tuned on Spanish voice samples to reproduce a specific speaker's vocal characteristics, including intonation, rhythm, accent, and voice timbre. Speech is generated server-side and streamed back to the device as a WAV file.

---

## Synthesis Parameters

| Parameter       | Range       | Description                                                                                              |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| **Temperature** | 0.1 – 1.0   | Controls randomness in speech prosody. Lower values sound more stable; higher values add expressiveness. |
| **Top P**       | 0.1 – 1.0   | Nucleus sampling threshold. Lower values reduce diversity.                                               |
| **Top K**       | 1 – 100     | Limits candidate tokens during generation.                                                               |
| **Seed**        | Any integer | Ensures reproducible audio output when reused.                                                           |

---

## Tech Stack

* **Framework**: React Native + Expo 54
* **Audio**: expo-audio
* **File system**: expo-file-system
* **Haptics**: expo-haptics
* **Sharing**: expo-sharing
* **Model**: Coqui XTTS v2
* **Backend**: Hugging Face Spaces (Gradio HTTP API)

---

## Building from Source

### Prerequisites

* Node.js 18+
* Expo CLI (`npm install -g expo-cli`)
* A Hugging Face token with access to the Space

### Setup

```bash
git clone https://github.com/jonorl/voice-clone-mobile
cd voice-clone-mobile
npm install
```

Create a `.env` file in the root:

```
EXPO_PUBLIC_HF_TOKEN=your_token_here
```

### Run

```bash
npx expo start
```

### Build APK (via EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## Ethical Use Notice

This project demonstrates voice cloning technology for **educational and experimental purposes only**. Ensure that you:

* Have **explicit permission** to clone any individual's voice
* Do **not** use generated audio for impersonation, fraud, or deception
* Comply with all applicable laws and platform policies

---

## License

This project uses **XTTS v2**, distributed under the **Coqui Public Model License**. Please review the license before commercial or large-scale usage.

---

## Acknowledgments

* [Coqui TTS](https://github.com/coqui-ai/TTS) for XTTS v2
* [Gradio](https://gradio.app/) for the backend interface
* Hugging Face Spaces for hosting