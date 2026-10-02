# Sharing and transfer

CAScad keeps notebooks on your device. To give one to someone else or to move
it to another device, choose one of the ways below. Each of them replaces the
notebook open on the receiving side: export it first if you want to keep it.

| Way | Network needed | Size | Best for |
|-----|----------------|------|----------|
| [QRShare](#send-to-another-device-with-qrshare) | No (QR codes) or yes (direct connection) | Any | Moving a notebook to another device, even offline |
| [Link containing the notebook](#link-containing-the-notebook) | To send the link | Small notebooks | Messages, e-mail, course pages |
| [QR codes in CAScad](#qr-codes-in-cascad) | No | Any (animated) | Showing a notebook on a screen |
| [Phone to computer](#phone-to-computer-p2p) | Yes | Any | A computer without a camera |
| File (💾 Export, 📂 Import) | — | Any | Keeping a copy, sending as an attachment |

## Send to another device with QRShare

[QRShare](https://github.com/s-celles/QRShare) is a companion web app that moves
files between two devices with **animated QR codes** — no account, no cloud,
even without any network — or with a direct peer-to-peer connection.
[Progressive Web Office](https://github.com/s-celles/progressive-web-office)
uses it the same way.

### Send

1. Click **📲 Send to device**.
2. Choose the **transfer**:
   - **Air-gapped only (QR codes)** — the notebook never travels over a network;
   - **Prefer air-gapped** (default) — QR codes are recommended, network modes
     stay available;
   - **Any mode** — QRShare may suggest a direct connection for large notebooks.
3. Click **Send with QRShare**. QRShare opens with the notebook
   (`notebook.cascad.json`) ready to send: no download, no upload.

If the QRShare you use cannot receive files from apps, or does not answer, the
notebook is downloaded and QRShare opens its *Prepare a transfer* screen, where
you select it.

The same window offers **Share with another app…** (the system share sheet, on
phones, tablets and some computers) and a [link containing the
notebook](#link-containing-the-notebook).

### Receive

1. Click **📥 Receive**: QRShare opens its receive screen.
2. Receive the notebook in QRShare (scan the QR codes, or accept the connection).
3. Click **Open in …** in QRShare: the notebook opens in CAScad.

Only files coming from the QRShare address set under **Advanced** are accepted,
and only CAScad, Giac or Xcas notebooks.

### Settings

Under **Advanced**, you can use another QRShare installation, for example a
copy hosted on your network. The address and the transfer choice are
remembered on this device.

QRShare and CAScad are separate applications, both under the GNU AGPL-3.0:
CAScad opens QRShare's public pages and exchanges the file with it inside the
browser (QRShare app handoff protocol, version 1).

## Link containing the notebook

The **📲 Send to device** window shows a link that contains the notebook
itself, compressed, after the `#` of the address (`…/CAScad/#nb=…`). Browsers
never send that part to a server: the notebook is stored nowhere but in the
link. Click **Copy link** and paste it in a message, an e-mail or a chat.

- Above about 8 KB, some messaging apps or mail clients may cut the link: send
  the file or use QRShare instead.
- Anyone who has the link can open the notebook.
- The link keeps the cells and their content, not the cell settings (hidden,
  disabled, locked) nor the kernel.

With **📤 Share** (on devices with a share sheet), CAScad shares the notebook
file, or this link when files cannot be shared.

## QR codes in CAScad

**📤 Share QR** shows the notebook as QR codes to scan with **📷 Scan QR** on
another device running CAScad.

- A small notebook fits in one QR code (a link).
- A larger one is shown as **animated QR codes**: keep the camera on the
  screen until the progress bar is full. *Fountain* codes (default) let the
  receiver start at any moment and miss some frames; *sequential* codes are
  numbered chunks. Adjust the speed (frames per second) and the chunk size if
  the camera has trouble.
- With a **password**, the notebook is encrypted (AES-GCM, key derived from the
  password); the receiver is asked for it. The password is never put in the
  QR codes or sent anywhere.

## Phone to computer (P2P)

For a computer without a camera, a phone can send its notebook over a direct
WebRTC connection:

1. On the **computer**, click **📲 Receive from Phone**: a QR code appears.
2. On the **phone**, click **📷 Scan QR** and scan it.
3. Both devices show the same **4-digit code**: check that they match.
4. The notebook is sent and opens on the computer.

Both devices need internet access: they find each other through a public
signalling server (PeerJS) and a STUN server, then the notebook travels
directly between them over an encrypted WebRTC channel. The computer waits 5
minutes for the phone.
