# Home Automation Battery Monitoring Service (PoC Phase)

This PoC will establish a **working foundation** for a **battery-focused,
real-time monitoring service** using passive Z-Wave network observation. It will
emphasize **device discovery**, **user-friendly interaction**, and **battery
health visibility** — all managed with a **clean local-first architecture**.

## Goal

Develop a **home automation battery monitoring service** focused initially on
**Z-Wave devices**.  
The service will make it simple and intuitive to:

- Learn when batteries need changing.
- Detect if devices have stopped responding.
- Understand device wake-up patterns over time.
- Monitor overall battery health of the Z-Wave network.

## Characteristics

- **Independence:**

  - The service will interface **directly with the Z-Wave network**, without
    depending on systems like Home Assistant.
  - It will act as an **independent agent**, assuming a single Z-Wave network
    for this phase.

- **User Interface:**

  - **Web-based live dashboard** displaying real-time battery statuses.
  - **Automatic device learning** by reconstructing the device list based on
    sniffed network traffic.
  - **User metadata**: Users can add information for each device such as:
  - Battery type.
  - Date of last battery change.
  - Other optional notes.

- **Hardware:**

  - **Primary hardware for PoC**: **ZGM230-DK2603A Development Kit** (zniffer
    device).
  - **Mode**: Passive network sniffing — no transmission or reception of regular
    Z-Wave messages.
  - **Platform**: Windows OS (initial focus).

- **Data Storage:**

  - **Historical battery data** will be stored in the **local file system**
    using **raw JSON files**.
  - **Notification history** will also be stored as local raw files.

- **Notification System:**

  - **In-app notifications** shown in the web interface:
    - **Low Battery Warning**.
    - **Missing Device Alert**.
  - No external integrations (email, SMS, push) during the PoC phase.

- **Network Traffic Processing:**

  - The service will **poll a `.zlf` file** (Z-Wave Log File) to read new
    network traffic data.
  - **Goal**: To generically support **all Z-Wave battery-powered devices**.

_Note: Future hardware options are out of scope for this PoC._

## Tech Stack

| Area                 | Technology                  |
| :------------------- | :-------------------------- |
| Programming Language | JavaScript (ESM modules)    |
| Backend Framework    | Express                     |
| Frontend Framework   | React                       |
| Z-Wave Interface     | Z-Wave JS library           |
| Development Platform | Windows                     |
| Development Tools    | Visual Studio Code, Node.js |

## Deliverables

- Standalone service that reads a `.zlf` file for Z-Wave network traffic.
- Real-time web dashboard showing:
  - Battery status per device.
  - User-added device metadata.
- Local storage of:
  - Battery status history (per device).
  - Notification events.
- Basic notification system inside the web UI.
- Robust device auto-discovery via sniffed Z-Wave traffic.

## Out of Scope

- Active participation in the Z-Wave network (i.e., sending commands).
- Support for multiple Z-Wave networks.
- External notification systems (email, push, etc.).
- Cloud storage or cloud services integration.
- Alternative hardware setups beyond ZGM230-DK2603A.
- Full-fledged production deployment.
