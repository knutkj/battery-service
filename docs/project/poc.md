# Home Automation Battery Monitoring Service (PoC Phase)

A **battery-focused monitoring service** for Z-Wave networks. The service
presents battery health, device identity, and network topology to the user.

## Goal

Make it simple and intuitive to:

- Learn when batteries need changing.
- Detect if devices have stopped responding.
- Understand device wake-up patterns over time.
- Monitor overall battery health of a Z-Wave network.

## Core principle: vendor-independent

The service is **not** tied to any controller vendor, cloud service, or home
automation platform.

In the first iteration, data is obtained by **passive RF sniffing** — the most
realistic approach with current hardware options. This is not optimal (battery
devices sleep, so not all traffic is captured), but it provides a working
foundation without requiring active network participation.

## Characteristics

- **Input:** The service ingests captured Z-Wave network traffic.
- **Device discovery:** Nodes are discovered from the captured traffic. Device
  identity (manufacturer, product type, product ID) is extracted automatically
  when available or entered manually by the user.
- **Network graph:** Nodes displayed as purpose-built SVG icons with battery
  indicators. Edges show direct and routed RF links.
- **Detail panel:** Clicking a node shows product information (from the Z-Wave
  Alliance Product Catalog), battery level, and user-supplied metadata.
- **Notifications:** The service alerts the user when a battery needs attention
  or a device has gone silent — proactively, so that no device ever runs out of
  power unnoticed. Notification delivery mechanism TBD.
- **User metadata:** Device location, battery type, last change date, custom
  name, and notes — editable per device.
- **Data storage:** The service persists device metadata, battery history, and
  notification events. Storage mechanism TBD.
- **Multi-home-ID:** Users may load captures from different Z-Wave networks.
  Node IDs are scoped to their home ID.
- **Hardware:** Passive sniffing requires a Zniffer-capable device (e.g.
  ZGM230-DK2603A Development Kit). The Zniffer observes RF traffic without
  participating in the network.

## Deliverables

- Z-Wave traffic parser (frame reassembly, MPDU decoding).
- Command class decoding: Battery Report, Manufacturer Specific, Wake Up,
  encapsulation unwrapping (CRC-16, Supervision, Security 2 identification).
- Network graph with SVG icons, battery indicators, and routing edges.
- Detail panel with product catalog lookup and user-editable metadata.
- CLI tools for offline capture analysis.
- Persistence of user metadata and device ID mappings.

## Out of scope

- Active participation in the Z-Wave network (sending commands).
- Cloud storage or cloud services integration.
- Alternative hardware setups beyond ZGM230-DK2603A.
- Full-fledged production deployment.

## To be investigated

- **Security 2 decryption.** Most modern Z-Wave devices encrypt traffic with
  S2 (AES-128-CCM). Without decryption, the service cannot read battery reports
  from encrypted devices — a significant limitation. Decryption requires the
  network keys, which must be obtained from the controller. This needs
  investigation to determine feasibility within the vendor-independent
  principle.

## Next steps

See [next-steps.md](next-steps.md) for the detailed task breakdown — what has
been implemented and what remains.
