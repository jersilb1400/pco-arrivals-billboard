# Windows VM Setup — Building & Testing the Arrivals Plugin on a Mac

> **Why this exists:** The Mac can't build .NET Framework / Rock plugins (no Rock
> assemblies, no IIS). The Azure Windows Server VM was decommissioned for cost
> (2026-07-09). Builds and Rock testing now happen on a **free, local Windows 11 ARM
> virtual machine** running on this Mac. This guide is the one-time setup plus the
> repeatable build/install/verify runbook.
>
> **Audience:** One-time setup (~1–2 hrs), then a 5-minute loop per build.
> **Status:** Target environment for `com.gracefellowship.Arrivals` (Rock v19.1).

---

## 0. Before you start — what you'll end up with

- A Windows 11 ARM VM on your Mac (free, no Windows license cost for dev use)
- Inside it: IIS + SQL Server Express + a dev Rock RMS v19.1 install
- The ability to `git pull && build-plugin.bat` → get a `.plugin` → install in Rock → test
- Total ongoing cost: **$0/month** (vs. the 24/7 Azure VM that was deleted)

**The one caveat:** Rock is an x64 .NET Framework app; it runs under **ARM emulation**
in the VM. Compiling the plugin works cleanly under emulation. Running Rock *should*
work — it's a heavy WebForms app, so if you hit weird `System.Web` errors or slowness,
the fallback is a cheap auto-shutdown Azure B-series VM (native x64) just for
smoke-testing. Try the free path first.

---

## 1. Choose your hypervisor (pick ONE — all free for personal use)

| Option | Cost | Notes |
|---|---|---|
| **UTM** (recommended) | Free, open-source | Built for Apple Silicon; simplest Windows ARM install. Download: <https://mac.getutm.app> |
| **VMware Fusion Pro** | Free for personal use | Now free as of 2024. Download: <https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion> |
| **Parallels Desktop** | Paid (trial available) | You may already have this from prior PCO Migration work — if so, use it. |

**Install UTM** (the rest of this guide assumes UTM, but VMware/Parallels are equivalent):
1. Download UTM from <https://mac.getutm.app> and drag to Applications.
2. Open UTM.

## 2. Create the Windows 11 ARM VM

UTM has a one-click Windows installer that downloads the official Microsoft VHDX:

1. In UTM, click **+** → **Virtualize** → **Windows 11** (the "Download and Install Windows" option).
2. UTM fetches the Windows 11 ARM VHDX from Microsoft's servers and creates the VM.
   - This requires a free Microsoft account sign-in on the Microsoft download page it opens.
   - It's the Windows on ARM Insider build — fine for dev.
3. **Allocate resources:** before first boot, edit the VM settings:
   - **RAM:** at least **6 GB** (8 GB preferred). Rock + SQL Server needs headroom.
   - **CPU:** 4 cores.
   - **Disk:** at least **60 GB** (Rock + SQL + build tools + NuGet cache).
4. Boot the VM, complete the Windows setup (skip/deny telemetry, sign in with a local account or MS account).

> **If UTM's one-click installer fails** (it occasionally does), the manual path:
> download the Windows 11 ARM64 VHDX directly from
> <https://www.microsoft.com/software-download/windowsinsiderpreviewarm64>,
> then in UTM: **+ → Virtualize → Windows → "Browse" for the VHDX**.

## 3. Inside the VM: install the prerequisites

Run these steps **inside the Windows VM** (not on the Mac).

### 3a. Enable IIS with the ASP.NET features
- Open **Control Panel → Programs → Turn Windows features on or off**
- Check **Internet Information Services** (expand it):
  - Under **World Wide Web Services → Application Development Features**, check:
    - `.NET Extensibility 4.7` (or 4.8)
    - `ASP.NET 4.7` (or 4.8)
    - `HTTP Activation` (under .NET features, sometimes needed)
  - Under **Common HTTP Features**: `Default Document`, `Static Content`, `Directory Browsing`, `HTTP Errors`
- Click OK and let Windows install. Reboot if prompted.

### 3b. Verify .NET Framework 4.7.2+ (usually preinstalled on Win11)
- Open PowerShell and run: `Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -Name Release`
- Release `528040`+ = 4.8 (fine). If it's missing or < 461808, install .NET Framework 4.8 from
  <https://dotnet.microsoft.com/download/dotnet-framework/net48>.

### 3c. Install Visual Studio Build Tools 2022 (free — gives you MSBuild)
- Download: <https://visualstudio.microsoft.com/visual-cpp-build-tools/> → "Build Tools for Visual Studio 2022"
- In the installer, select the **".NET Framework 4.7.2 SDK"** and **"MSBuild"** components
  (also fine to add the full ".NET desktop build tools" workload).
- This installs MSBuild to a path the `build-plugin.bat` script searches:
  `C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe`
  (the script also checks the "VS 18" path and VS 2019).

### 3d. Install SQL Server 2022 Express (free)
- Download: <https://www.microsoft.com/sql-server/sql-server-downloads> → scroll to **Express** (free)
- Run the installer → **Basic** → accept defaults.
- Note the **connection string** it shows at the end (usually `Server=localhost\SQLEXPRESS;Database=...;Trusted_Connection=True;...`).
- You'll use `localhost\SQLEXPRESS` as the Rock database server during Rock setup.
- Alternatively, **LocalDB** (lighter) works for dev if you prefer — install via the Build Tools "SQL Server Express LocalDB" component.

### 3e. Install Git
- Download: <https://git-scm.com/download/win> → default install.
- Verify in PowerShell: `git --version`

## 4. Deploy Rock RMS into IIS

### 4a. Download Rock
- Go to <https://www.rockrms.com/download>
- Download the **full ZIP** (not the Web Installer — the full ZIP is more reliable in a VM).
- You may need a free Rock account.

### 4b. Create the Rock site in IIS
- Extract the Rock ZIP to `C:\inetpub\wwwroot\Rock`
- Open **IIS Manager** (Start → "IIS"):
  - Right-click **Sites → Add Website**
  - **Site name:** `Rock`
  - **Physical path:** `C:\inetpub\wwwroot\Rock`
  - **Binding:** HTTP, port 80, host name blank
  - **Application pool:** it creates `Rock` app pool automatically
- Set the app pool to **.NET CLR version v4.0** and **Integrated** pipeline mode:
  - Application Pools → `Rock` → Basic Settings → .NET CLR version = `v4.0.30319`, Managed pipeline mode = `Integrated`

### 4c. Create the Rock database
- Open **SQL Server Management Studio** (SSMS — free download if not installed) or use `sqlcmd`.
- Connect to `localhost\SQLEXPRESS`.
- Create an empty database named `RockRMS`:
  ```sql
  CREATE DATABASE RockRMS;
  ```
- Create a SQL login Rock can use (or use Trusted Connection / Windows auth for dev):
  ```sql
  CREATE LOGIN RockUser WITH PASSWORD = 'YourStrongDevPassword123!';
  USE RockRMS;
  CREATE USER RockUser FOR LOGIN RockUser;
  ALTER ROLE db_owner ADD MEMBER RockUser;
  ```

### 4d. Configure Rock's connection string
- Edit `C:\inetpub\wwwroot\Rock\web.ConnectionStrings.config` (Rock uses a separate configSource file):
  ```xml
  <connectionStrings>
    <add name="RockContext" connectionString="Server=localhost\SQLEXPRESS;Database=RockRMS;User Id=RockUser;Password=YourStrongDevPassword123!;Encrypt=False;TrustServerCertificate=True" providerName="System.Data.SqlClient" />
  </connectionStrings>
  ```
  (For dev, `Encrypt=False;TrustServerCertificate=True` avoids cert errors.)

### 4e. Run the Rock installer
- In IIS Manager, **restart** the `Rock` app pool (right-click → Recycle, or `Restart-WebAppPool Rock`).
- Open a browser **inside the VM** → `http://localhost`
- Follow the Rock installer wizard (it creates tables, seeds data). Choose a dev campus, set the admin password.
- When done, log in as admin and confirm the Rock homepage loads.

✅ **You now have a dev Rock v19.1 at `http://localhost`** with `C:\inetpub\wwwroot\Rock\Bin\` available for plugin references.

## 5. Get the plugin source into the VM

In PowerShell inside the VM:
```powershell
cd C:\dev   # create it if needed: mkdir C:\dev
git clone https://github.com/jersilb1400/pco-arrivals-billboard.git
cd pco-arrivals-billboard
git checkout rock-plugin
```

> **Note:** if the repo is private, authenticate with a Personal Access Token when prompted,
> or clone via SSH if you've set up keys.

---

## 6. The build/install/verify runbook (repeat every change)

After each `git pull` on the VM:

### 6a. First build only — restore NuGet packages
```powershell
cd C:\dev\pco-arrivals-billboard
& "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" com.gracefellowship.Arrivals.csproj /t:Restore /p:Configuration=Release
```
(Only needed the first time, or after editing `<PackageReference>` entries.)

### 6b. Build the .plugin package
```powershell
.\build-plugin.bat
```
**Expected success output:**
```
SUCCESS: .plugin package created at PluginStaging\com.gracefellowship.Arrivals-v1.0.0.plugin
```
If it fails, paste the full output back to the assistant.

### 6c. Install the .plugin in Rock
- Copy the `.plugin` file to Rock's packages folder:
  ```powershell
  Copy-Item "PluginStaging\com.gracefellowship.Arrivals-v1.0.0.plugin" "C:\inetpub\wwwroot\Rock\App_Data\Packages\" -Force
  ```
- In Rock (browser, logged in as admin): **Admin Tools → CMS Configuration → Installed Plugins → Install**
  - Select the Arrivals plugin → Install. Migrations run automatically.
- **Recycle the app pool:**
  ```powershell
  Import-Module WebAdministration -ErrorAction SilentlyContinue
  Restart-WebAppPool -Name "Rock"
  ```

### 6d. Verify the four pages load
Open each in the browser (inside the VM):
- `http://localhost/Page/<ADMIN-PAGE-ID>` — or navigate via **Admin Tools → Power Tools → Arrivals Admin**
- Same for **Arrivals Security Code Entry**, **Arrivals Billboard**, **Arrivals Location Status**

Each should render "Plugin skeleton installed." with **no "Server Error in '/' Application"**.

If you get "Server Error," the two most likely causes (from the playbook):
1. **DLL in `Plugins\` instead of `bin\`** — check `C:\inetpub\wwwroot\Rock\Bin\com.gracefellowship.Arrivals.dll` exists. The build script puts it in `bin\`; verify it landed there.
2. **App pool not recycled** — recycle again.

### 6e. Report back
Tell the assistant:
- Did `build-plugin.bat` succeed? (paste output if not)
- Did the `.plugin` install without error?
- Do all 4 pages load without "Server Error"?

That's the Phase 0 gate. Once it passes, we proceed to Phase 1 (data layer).

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `MSBuild not found` in build-plugin.bat | Install VS Build Tools 2022 (step 3c). The script checks the VS 2022 / VS "18" / VS 2019 paths. |
| NuGet restore fails (offline) | The VM needs internet for the first restore. Ensure network is set to "bridged" or NAT in UTM. |
| `Server Error in '/' Application` on plugin page | DLL not in `bin\`, or app pool needs recycling. See step 6d. |
| `An item with the same key has already been added` | The plugin DLL is in `Plugins\` instead of `bin\`. Move it to `bin\`. (LESSONS.md L1.) |
| Rock is very slow under emulation | Expected to some degree on ARM. If unusable, consider the auto-shutdown Azure VM fallback (below). |
| Can't reach `http://localhost` | Ensure IIS is running (`iisreset /start`) and the site binding is correct. |
| SQL connection error in Rock | Verify `web.ConnectionStrings.config` (step 4d), SQL Server service is running, and the login has `db_owner`. |

## 8. Fallback: cheap auto-shutdown Azure VM (if ARM emulation fails for Rock)

Only if step 4e/6d shows Rock is unusable under emulation:
- Provision an Azure **B2ms** VM (2 vCPU, 8 GB) with **Windows Server 2022** (native x64).
- Configure **auto-shutdown** (Azure portal → VM → Auto-shutdown → set a time, or use a schedule). You pay only for running hours.
- Approx cost: ~$0.10/hr compute + ~$5/mo disk. For dev (a few hours/week), ~$15–30/mo.
- Install the same prerequisites (steps 3–5) and run the same runbook (step 6).
- **Always shut it down when done** — set auto-shutdown as a safety net even if you forget manually.
