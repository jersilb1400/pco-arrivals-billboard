PCO Arrivals Billboard

A real-time digital signage application that displays check-in arrivals from Planning Center Online (PCO) on a billboard or display screen. Perfect for churches and organizations using Planning Center for event management.

🌟 Features
Live Updates: Real-time display of check-ins from Planning Center Online.
Customizable Display: Configure the appearance to match your organization's branding.
Multiple Display Modes: Choose between different display layouts.
Auto-Refresh: Automatically updates to show new check-ins.
Responsive Design: Works on various screen sizes and orientations.
📋 Prerequisites
Before you begin, ensure you have the following:

A Planning Center Online account with Check-ins enabled.
PCO API credentials (Application ID and Secret).
Python 3.7+ installed.
A web browser for displaying the billboard.

🚀 Installation
1. Clone the Repository

git clone https://github.com/jersilb1400/pco-arrivals-billboard.git
cd pco-arrivals-billboard

2. Set Up a Virtual Environment (Recommended)

python -m venv venv
source venv/bin/activate     # On Windows, use: venv\Scripts\activate

3. Install Dependencies

pip install -r requirements.txt

4. Configure Environment Variables
Create a .env file in the root directory with your PCO API credentials:

Code
PCO_APP_ID=your_application_id
PCO_SECRET=your_secret_key

5. Run the Application

python app.py

6. Access the Billboard
Open your web browser and navigate to:
http://localhost:5000

⚙️ Configuration
Application Settings
Edit the config.py file to customize the following:

CHECK_IN_STATION_ID: The ID of your PCO check-in station.
REFRESH_INTERVAL: Time between updates (in seconds).
MAX_ARRIVALS: Maximum number of arrivals to display.
DISPLAY_MODE: Choose between different visual layouts.

Display Customization
Modify the CSS in static/css/style.css.
Update the layout templates in the templates/ directory.
Add your logo to static/images/ and update the reference in the templates.

🖥️ Usage
Basic Setup
Launch the application on a computer connected to your display screen.
Open the browser in full-screen mode (F11 in most browsers).
Navigate to the application URL.

Display Options
Standard View: Shows names and timestamps of recent check-ins.

Count View: Displays totals by category/location.

Split View: Shows both names and counts in a split-screen format.
Change the view by adding the ?mode= parameter to the URL:

Code
http://localhost:5000?mode=standard
http://localhost:5000?mode=count
http://localhost:5000?mode=split

🔄 API Integration
This application uses the following PCO API endpoints:

Check-ins API: For accessing real-time check-in data.
People API: For retrieving additional person details (optional).
API requests are cached to minimize the number of calls and improve performance.

🧰 Troubleshooting
Common Issues
No data appearing: Verify your PCO API credentials and check-in station ID.
Slow refresh: Check your network connection or adjust the refresh interval.
API rate limiting: Implement longer caching or reduce the refresh frequency.

Logs
Application logs are stored in logs/app.log. Check this file for error messages and debugging information.

🔒 Security Notes
Keep your .env file secure and never commit it to version control.
This application should be run on a secure, internal network.
Consider implementing authentication if the display is publicly accessible.

⚡ Advanced Setup
Running as a Service
Linux (systemd):
Create a file at /etc/systemd/system/pco-billboard.service:
INI
[Unit]
Description=PCO Arrivals Billboard
After=network.target

[Service]
User=your_user
WorkingDirectory=/path/to/pco-arrivals-billboard
ExecStart=/path/to/pco-arrivals-billboard/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
Enable and start the service:
bash
sudo systemctl enable pco-billboard.service
sudo systemctl start pco-billboard.service
Windows:
Use NSSM (Non-Sucking Service Manager) to create a Windows service for the application.

Using with a Raspberry Pi
Install Raspberry Pi OS.
Clone the repository and install dependencies.
Configure auto-start in /etc/xdg/lxsession/LXDE-pi/autostart.
Set up the browser to launch in kiosk mode.

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository.
Create your feature branch:
bash
git checkout -b feature/amazing-feature
Commit your changes:
bash
git commit -m 'Add some amazing feature'
Push to the branch:
bash
git push origin feature/amazing-feature
Open a Pull Request.
Made with ❤️ for churches and organizations using Planning Center Online.
