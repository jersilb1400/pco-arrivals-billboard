PCO Arrivals Billboard

A real-time digital signage application that displays check-in arrivals from Planning Center Online (PCO) on a billboard/display screen. Perfect for churches and organizations using Planning Center for check-ins.
🌟 Features

Live Updates: Real-time display of check-ins from Planning Center Online
Customizable Display: Configure the appearance to match your organization's branding
Multiple Display Modes: Choose between different display layouts
Auto-Refresh: Automatically updates to show new check-ins
Responsive Design: Works on various screen sizes and orientations

📋 Prerequisites
Before you begin, ensure you have:

A Planning Center Online account with Check-ins enabled
PCO API credentials (Application ID and Secret)
Python 3.7+ installed
A web browser for displaying the billboard

🚀 Installation

Clone the repository

bashCopygit clone https://github.com/jersilb1400/pco-arrivals-billboard.git
cd pco-arrivals-billboard

Set up a virtual environment (recommended)

bashCopypython -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

Install dependencies

bashCopypip install -r requirements.txt

Configure environment variables

Create a .env file in the root directory with your PCO API credentials:
CopyPCO_APP_ID=your_application_id
PCO_SECRET=your_secret_key

Run the application

bashCopypython app.py

Access the billboard

Open your web browser and navigate to:
Copyhttp://localhost:5000
⚙️ Configuration
Application Settings
Edit the config.py file to customize:

CHECK_IN_STATION_ID: The ID of your PCO check-in station
REFRESH_INTERVAL: Time between updates (in seconds)
MAX_ARRIVALS: Maximum number of arrivals to display
DISPLAY_MODE: Choose between different visual layouts

Display Customization
You can customize the appearance by:

Modifying the CSS in static/css/style.css
Updating the layout templates in templates/
Adding your logo to static/images/ and updating the reference in the templates

🖥️ Usage
Basic Setup

Launch the application on a computer connected to your display screen
Open the browser in full-screen mode (F11 in most browsers)
Navigate to the application URL

Display Options

Standard View: Shows names and timestamps of recent check-ins
Count View: Displays totals by category/location
Split View: Shows both names and counts in a split-screen format

Change the view by adding ?mode= parameter to the URL:
Copyhttp://localhost:5000?mode=standard
http://localhost:5000?mode=count
http://localhost:5000?mode=split
🔄 API Integration
This application uses the following PCO API endpoints:

Check-ins API for accessing real-time check-in data
People API for retrieving additional person details (optional)

API requests are cached to minimize the number of calls and improve performance.
🧰 Troubleshooting
Common Issues

No data appearing: Verify your PCO API credentials and check-in station ID
Slow refresh: Check your network connection or adjust the refresh interval
API rate limiting: Implement longer caching or reduce refresh frequency

Logs
Application logs are stored in logs/app.log. Check this file for error messages and debugging information.
🔒 Security Notes

Keep your .env file secure and never commit it to version control
This application should be run on a secure, internal network
Consider implementing authentication if the display is publicly accessible

⚡ Advanced Setup
Running as a Service
For permanent installations, you may want to run the application as a service:
Linux (systemd):
Create a file at /etc/systemd/system/pco-billboard.service:
iniCopy[Unit]
Description=PCO Arrivals Billboard
After=network.target

[Service]
User=your_user
WorkingDirectory=/path/to/pco-arrivals-billboard
ExecStart=/path/to/pco-arrivals-billboard/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
Then enable and start the service:
bashCopysudo systemctl enable pco-billboard.service
sudo systemctl start pco-billboard.service
Windows:
Use NSSM (Non-Sucking Service Manager) to create a Windows service for the application.
Using with a Raspberry Pi
This application works great on a Raspberry Pi connected to a display:

Install Raspberry Pi OS
Clone the repository and install dependencies
Configure auto-start in /etc/xdg/lxsession/LXDE-pi/autostart
Set up the browser to launch in kiosk mode

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request





Made with ❤️ for churches and organizations using Planning Center OnlineAdd to Conversation
