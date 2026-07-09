@echo off
setlocal enabledelayedexpansion

:: Grace Arrivals Billboard Plugin - Build and Package Script (manual-install ZIP)
:: Produces a ZIP for quick dev deploys: extract into the Rock web root by hand,
:: then run migrations from Rock (or rely on install-to-rock.bat).
::
:: For distribution/staging/production, prefer build-plugin.bat (produces a .plugin
:: file that installs via the Rock UI with automatic migrations).
::
:: Run this from the project root (same folder as com.gracefellowship.Arrivals.csproj)

set VERSION=1.0.0
set PACKAGE_NAME=ArrivalsBillboard-v%VERSION%
set STAGING=ReleaseStaging\%PACKAGE_NAME%
set ZIP_NAME=%PACKAGE_NAME%.zip
set PLUGIN_FOLDER=com_gracefellowship_Arrivals

:: Find MSBuild (try common paths)
set MSBUILD=
if exist "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\MSBuild.exe" (
    set "MSBUILD=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
    goto :found
)
if exist "C:\Program Files\Microsoft Visual Studio\2022\*\MSBuild\Current\Bin\MSBuild.exe" (
    for /f "delims=" %%i in ('dir /b "C:\Program Files\Microsoft Visual Studio\2022"') do (
        if exist "C:\Program Files\Microsoft Visual Studio\2022\%%i\MSBuild\Current\Bin\MSBuild.exe" (
            set "MSBUILD=C:\Program Files\Microsoft Visual Studio\2022\%%i\MSBuild\Current\Bin\MSBuild.exe"
            goto :found
        )
    )
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe" (
    set "MSBUILD=C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
    goto :found
)
echo ERROR: MSBuild not found. Please install Visual Studio Build Tools or set MSBUILD path manually.
exit /b 1

:found
echo Using MSBuild: %MSBUILD%
echo.

:: Clean and build
echo Building project...
"%MSBUILD%" com.gracefellowship.Arrivals.csproj /t:Rebuild /p:Configuration=Release /v:m
if errorlevel 1 (
    echo Build failed.
    exit /b 1
)
echo Build succeeded.
echo.

:: Create staging folder
echo Creating package...
if exist "ReleaseStaging" rmdir /s /q ReleaseStaging
mkdir "%STAGING%\bin"
mkdir "%STAGING%\Plugins\%PLUGIN_FOLDER%\Blocks"

:: Copy DLL to bin\  (NEVER to Plugins\ — see .context/LESSONS.md L1)
copy /Y "bin\Release\com.gracefellowship.Arrivals.dll" "%STAGING%\bin\"

:: Copy block files to Plugins\...\Blocks\
for %%F in (ArrivalsAdmin SecurityCodeEntry Billboard LocationStatus) do (
    if exist "Blocks\%%F.ascx" (
        copy /Y "Blocks\%%F.ascx"            "%STAGING%\Plugins\%PLUGIN_FOLDER%\Blocks\"
        copy /Y "Blocks\%%F.ascx.cs"         "%STAGING%\Plugins\%PLUGIN_FOLDER%\Blocks\"
        copy /Y "Blocks\%%F.ascx.designer.cs" "%STAGING%\Plugins\%PLUGIN_FOLDER%\Blocks\"
    )
)

:: Copy block assets (CSS, etc.) that ship alongside the blocks
if exist "Blocks\*.css" copy /Y "Blocks\*.css" "%STAGING%\Plugins\%PLUGIN_FOLDER%\Blocks\"
copy /Y "INSTALL.txt" "%STAGING%\" 2>nul
copy /Y "install-to-rock.bat" "%STAGING%\" 2>nul
copy /Y "USER_GUIDE.md" "%STAGING%\" 2>nul

:: Create ZIP (PowerShell)
echo Creating ZIP: %ZIP_NAME%
powershell -NoProfile -Command "Compress-Archive -Path '%STAGING%\*' -DestinationPath 'ReleaseStaging\%ZIP_NAME%' -Force"
if errorlevel 1 (
    echo ZIP creation failed. Try using 7-Zip or another compression tool manually.
) else (
    echo.
    echo SUCCESS: Package created at ReleaseStaging\%ZIP_NAME%
    echo Extract this ZIP to your Rock web root and follow INSTALL.txt
)

:: Cleanup staging (keep ZIP)
rmdir /s /q "%STAGING%" 2>nul

endlocal
