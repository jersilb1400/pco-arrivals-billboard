@echo off
setlocal enabledelayedexpansion

:: Grace Arrivals Billboard Plugin - Build Rock .plugin Package
:: Produces a proper Rock RMS plugin file (App_Data\Packages install method).
::
:: A .plugin file is a ZIP archive (renamed to .plugin) whose internal layout
:: mirrors the Rock web root: bin\*.dll + Plugins\<plugin>\Blocks\*.ascx.
:: Rock discovers migrations automatically by reflecting over the DLL for
:: Rock.Plugin.Migration subclasses tagged with [MigrationNumber].
::
:: Run this from the project root (same folder as the .csproj).

set VERSION=1.0.0
set PACKAGE_NAME=com.gracefellowship.Arrivals-v%VERSION%
set STAGING=PluginStaging\%PACKAGE_NAME%
set PLUGIN_NAME=%PACKAGE_NAME%.plugin
set PLUGIN_FOLDER=com_gracefellowship_Arrivals

:: Find MSBuild (checks VS "18" BuildTools, VS 2022, then VS 2019 BuildTools)
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

:: Stage the .plugin folder tree (mirrors Rock web root)
echo Creating .plugin package...
if exist "PluginStaging" rmdir /s /q PluginStaging
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

:: Create the .plugin file (ZIP with .plugin extension)
echo Creating .plugin file: %PLUGIN_NAME%
powershell -NoProfile -Command "Compress-Archive -Path '%STAGING%\*' -DestinationPath 'PluginStaging\%PLUGIN_NAME%.zip' -Force"
if errorlevel 1 (
    echo .plugin creation failed.
    exit /b 1
)
:: Rename .zip to .plugin
move /Y "PluginStaging\%PLUGIN_NAME%.zip" "PluginStaging\%PLUGIN_NAME%" >nul

if exist "PluginStaging\%PLUGIN_NAME%" (
    echo.
    echo SUCCESS: .plugin package created at PluginStaging\%PLUGIN_NAME%
    echo To install: copy this file to ^<RockRoot^>\App_Data\Packages\
    echo then go to Admin Tools ^> CMS Configuration ^> Installed Plugins ^> Install.
) else (
    echo FAILED: .plugin file was not created.
    exit /b 1
)

:: Cleanup staging folder (keep the .plugin file)
rmdir /s /q "%STAGING%" 2>nul

endlocal
