# Simplicity Studio Z-Wave Zniffer

- **Version used under development:** 4.69.1 © 2018 Silicon Labs. All rights
  reserved.
- **About:** A development tool for capturing the Z-Wave network communications
  within direct Z-Wave RF range and presenting the frames in a graphical user
  interface. Note please, that it is a passive listener that can occasionally
  miss some RF communication even from Z-Wave nodes that are within direct
  range.

## Table View

We can see an example of three rows in Simplicity Studio Z-Wave Zniffer below:

|   # | Date     | Time         | Speed | RSSI |   C |   Δ |   S | Home       | Data       | Application         | Hex Data                                 |
| --: | :------- | :----------- | ----: | ---: | --: | --: | --: | :--------- | ---------- | ------------------- | ---------------------------------------- |
|   1 | 22.03.25 | 14:13:34.339 |   40K |   44 |   1 |   0 |   6 | `C4A815CD` | Singlecast | Basic Set           | `C4A815CD0651010D012001FFCF`             |
|   2 | 22.03.25 | 14:13:34.348 |   40K |   50 |   1 |   9 |   1 | `C4A815CD` | Ack        |                     | `C4A815CD0113010A0654`                   |
|   3 | 22.03.25 | 14:13:34.655 |   40K |   45 |   1 | 306 |   6 | `C4A815CD` | Singlecast | Notification Report | `C4A815CD06510213017105000000FF07080088` |

- Channel (C):
- Delta (Δ):
- Source (S):
- Destination (D):

## Details View: Row #1 from table

### Header

#### Singlecast

- **Home ID:** C4A815CD
- **Source Node ID:** 6
- **Properties1:** 0x51
  - **Header Type:** 0x01
  - **Speed Modified:** true
  - **Low Power:** false
  - **Ack:** true
  - **Routed:** false
- **Properties2:** 0x01
  - **Sequence Number:** 1
  - **Reserved:** false
  - **Source Wakeup Beam 250ms:** false
  - **Wakeup Source Beam 1000ms:** false
  - **SUC Present:** false
- **Length:** 13
- **Destination Node ID:** 1

### Application

#### Command Class Basic ver.2

- Basic Set: Value: 0xFF

#### Command Class Basic ver.1

- Basic Set: Value: 0xFF
