from flask import Flask, render_template, jsonify, request, session
import json
import os
from werkzeug.utils import secure_filename
import uuid
import datetime
import hashlib
import secrets
app = Flask(__name__)

# Configure secret key for sessions
app.secret_key = secrets.token_hex(16)

# Configure upload settings
UPLOAD_FOLDER = 'static/img/issues'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return hash_password(password) == hashed

def load_users():
    """Load users from JSON file"""
    try:
        with open('json/users.json', 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def save_users(users):
    """Save users to JSON file"""
    with open('json/users.json', 'w', encoding='utf-8') as file:
        json.dump(users, file, ensure_ascii=False, indent=4)

def get_next_user_id(users):
    """Get the next available user ID"""
    if not users:
        return "user-1"
    
    max_id = 0
    for user in users:
        if user.get('id', '').startswith('user-'):
            try:
                current_id = int(user['id'].split('-')[1])
                max_id = max(max_id, current_id)
            except (ValueError, IndexError):
                continue
    
    return f"user-{max_id + 1}"

# Authentication routes
@app.route('/auth')
def auth():
    return render_template('auth.html')

@app.route('/admin')
def admin_panel():
    """Admin panel for managing users"""
    if 'user_id' not in session:
        return render_template('auth.html')
    
    user_id = session['user_id']
    users = load_users()
    
    # admin/manager check
    current_user = None
    for user in users:
        if user.get('id') == user_id:
            current_user = user
            break
    # als de gebruiker niet bestaat of geen admin/manager is, ga naar auth, anders naar admin
    if not current_user or current_user.get('role') not in ['admin', 'manager']:
        return render_template('auth.html')
    
    return render_template('admin.html')

@app.route('/create_user', methods=['POST'])
def create_user():
    """Create a new manager or host account (admin/manager only)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    # Dit is inmiddels wel duidelijk he, eerst data ophalen uit de json, dan daaruit de username, password en role trekken.
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    # Als de username, password of role niet is ingevuld, return een error
    if not all([username, password, role]):
        return jsonify({'success': False, 'message': 'All fields are required'})
    # als de role niet manager of host is, return een error
    if role not in ['manager', 'host']:
        return jsonify({'success': False, 'message': 'Invalid role. Only manager and host roles can be created'})
    
    user_id = session['user_id']
    users = load_users()
    
    current_user = None
    for user in users:
        if user.get('id') == user_id:
            current_user = user
            break
    
    if not current_user or current_user.get('role') not in ['admin', 'manager']:
        return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
    
    for user in users:
        if user.get('username') == username:
            return jsonify({'success': False, 'message': 'Username already exists'})
    

    user_id = get_next_user_id(users)
    new_user = {
        'id': user_id,
        'username': username,
        'password': hash_password(password),
        'role': role
    }
    # bladiebladiebla, append de user aan de lijst en push em terug naar de json.
    users.append(new_user)
    save_users(users)
    
    return jsonify({'success': True, 'message': f'{role.capitalize()} account created successfully'})

@app.route('/get_users', methods=['GET'])
def get_users():
    """Get all users (admin/manager only)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    user_id = session['user_id']
    users = load_users()
    
    # User id pakken.
    current_user = None
    for user in users:
        if user.get('id') == user_id:
            current_user = user
            break
    # Als de user geen manager/admin is, return weer een error.
    if not current_user or current_user.get('role') not in ['admin', 'manager']:
        return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
    
    # Return users zonder ww
    safe_users = []
    for user in users:
        safe_users.append({
            'id': user['id'],
            'username': user['username'],
            'role': user['role']
        })
    
    return jsonify({'success': True, 'users': safe_users})

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user (admin only)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    current_user_id = session['user_id']
    users = load_users()
    
    # Zucht, weer precies hetzelfde, ik had hier eigenlijk een functie voor moeten maken.
    current_user = None
    for user in users:
        if user.get('id') == current_user_id:
            current_user = user
            break
    
    if not current_user or current_user.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Only admins can delete users'}), 403
    
    # Jezelf niet verwijderen
    if current_user_id == user_id:
        return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
    
    # Vind de user, verwijder de user, en save de json
    users = [user for user in users if user.get('id') != user_id]
    save_users(users)
    
    return jsonify({'success': True, 'message': 'User deleted successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'success': False, 'message': 'Username and password are required'})
    
    users = load_users()
    
    # Loop door de users, als de username klopt, check de password, en return de
    for user in users:
        if user.get('username') == username:
            if verify_password(password, user.get('password', '')):
                # Session aanmaken
                session['user_id'] = user['id']
                session['username'] = user['username']
                
                # Return user data, wederom zonder wachtwoord
                user_data = {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
                
                return jsonify({'success': True, 'user': user_data})
            else:
                return jsonify({'success': False, 'message': 'Invalid password'})
    
    return jsonify({'success': False, 'message': 'Username not found'})

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/current_user', methods=['GET'])
def current_user():
    """Get current logged-in user information"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    user_id = session['user_id']
    users = load_users()
    
    # Wie ben ik
    for user in users:
        if user.get('id') == user_id:
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
            return jsonify({'success': True, 'user': user_data})
    
    return jsonify({'success': False, 'message': 'User not found'}), 404

# issue page, user can see issues for a specific room
@app.route('/issues', defaults={'room_id': None}) #idk wat dit is. Dit is een default value voor room_id, als er geen room_id is, dan is het None
@app.route('/issues/<room_id>')
def issues(room_id):
    if (room_id):
        if room_id == 'all-issues':
            return render_template('allIssues.html')
        return render_template('issues.html', room_id=room_id)
    else:
        return render_template('issuesHome.html')

@app.route('/upload_issue_image', methods=['POST'])
def upload_issue_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        filename = secure_filename(unique_filename)
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Return the relative path for use in the frontend
        relative_path = f"../static/img/issues/{filename}"
        return jsonify({'success': True, 'imagePath': relative_path})
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/delete_issue_image', methods=['DELETE'])
def delete_issue_image():
    data = request.get_json()
    image_path = data.get('imagePath')
    
    if not image_path:
        return jsonify({'error': 'No image path provided'}), 400
    
    # Extract filename from the relative path
    # imagePath is like "../static/img/issues/filename.jpg"
    filename = os.path.basename(image_path)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Image deleted successfully'})
        else:
            return jsonify({'error': 'Image file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error deleting image: {str(e)}'}), 500

@app.route('/create_issue', methods=['POST'])
def create_issue():
    issuesFile = 'json/issues.json'
    data = request.get_json()
    print("Received data:", data)
    
    # Check if user is logged in
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "User must be logged in to create issues"}), 401
    
    # Get user information from session
    user_id = session['user_id']
    users = load_users()
    
    # Find the logged-in user
    logged_in_user = None
    for user in users:
        if user.get('id') == user_id:
            logged_in_user = {
                'id': user['id'],
                'username': user['username']
            }
            break
    
    if not logged_in_user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    try:
        with open(issuesFile, 'r', encoding='utf-8') as file:
            issues = json.load(file)
    except FileNotFoundError:
        issues = []
    
    # Add createdBy and dateCreated to the issue data
    data['createdBy'] = logged_in_user
    data['dateCreated'] = datetime.datetime.now().isoformat()
    
    print("Creating issue with data:", data)
    issues.append(data)
    with open(issuesFile, 'w', encoding='utf-8') as file:
        json.dump(issues, file, ensure_ascii=False, indent=4)
    return jsonify({"status": "success", "data": data})

@app.route('/update_issue/<int:issue_index>', methods=['PUT'])
def update_issue(issue_index):
    issuesFile = 'json/issues.json'
    data = request.get_json()
    print("Updating issue at index:", issue_index, "with data:", data)
    try:
        with open(issuesFile, 'r', encoding='utf-8') as file:
            issues = json.load(file)
        
        if 0 <= issue_index < len(issues):
            issues[issue_index] = data
            with open(issuesFile, 'w', encoding='utf-8') as file:
                json.dump(issues, file, ensure_ascii=False, indent=4)
            return jsonify({"status": "success", "data": data})
        else:
            return jsonify({"status": "error", "message": "Issue not found"}), 404
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "Issues file not found"}), 404

@app.route('/delete_issue/<int:issue_index>', methods=['DELETE'])
def delete_issue(issue_index):
    issuesFile = 'json/issues.json'
    print("Deleting issue at index:", issue_index)
    try:
        with open(issuesFile, 'r', encoding='utf-8') as file:
            issues = json.load(file)
        
        if 0 <= issue_index < len(issues):
            deleted_issue = issues[issue_index]
            
            # Delete associated image if it exists
            if deleted_issue and isinstance(deleted_issue, dict) and deleted_issue.get('image'):
                image_path = deleted_issue['image']
                filename = os.path.basename(image_path)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"Deleted image file: {file_path}")
                except Exception as e:
                    print(f"Error deleting image file: {e}")
            
            # Remove the issue from the list
            issues.pop(issue_index)
            
            with open(issuesFile, 'w', encoding='utf-8') as file:
                json.dump(issues, file, ensure_ascii=False, indent=4)
            return jsonify({"status": "success", "deleted": deleted_issue})
        else:
            return jsonify({"status": "error", "message": "Issue not found"}), 404
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "Issues file not found"}), 404

# load priority
@app.route('/get_priority')
def get_priority():
    try:
        with open('json/priority.json') as file:
            priority = json.load(file)
            print(priority)
            return jsonify(priority)
    except FileNotFoundError:
        return "Priority file not found", 404

# load issues
@app.route('/get_issues/<room_id>')
def get_issues(room_id):
    """
    Haalt problemen (issues) op uit een JSON-bestand en filtert deze optioneel op basis van een opgegeven kamer-ID.
    Args:
        room_id (str): De ID van de kamer waarvoor de problemen gefilterd moeten worden. Gebruik 'all' om alle problemen op te halen.
    Returns:
        Response: Een JSON-response met de gefilterde problemen, of een foutmelding als het bestand niet gevonden wordt.
    """
    
    try:
        with open('json/issues.json') as file:
            issues = json.load(file)
            if room_id:
                # Filter issues by room_id
                print(f"Filtering issues for room: {room_id}")
                if room_id == 'all':
                    print("Fetching all issues")
                else:
                    issues = [issue for issue in issues if issue.get('room') == room_id]
                print(f"Filtered issues: {issues}")
            return jsonify(issues)
    # if you dont do this and the file doesn't exist, everything crashes
    except FileNotFoundError:
        return "Issues file not found", 404

# get data from json
@app.route('/get_room_config')
def get_room_config():
    try:
        with open('json/config.json') as file:
            room_config = json.load(file)
            print (room_config)
            return jsonify(room_config)
    except FileNotFoundError:
        return "Room config file not found", 404

# inventory page
@app.route('/inventory')
#def is a function
def inventory():
    return render_template('inventory.html')
@app.route('/get_inventory')
#def is a function
def get_inventory():
    try:
        # open the JSON as a temporary fake file. Store the data in a variable
        # with is how it works (nog opzoeken)
        with open('json/inventory.json') as file:
            # store all loaded data in inventory variable and print
            inventory = json.load(file)
            print (inventory)
            # jsonify the data
            return jsonify(inventory)
    except FileNotFoundError:
        return "Inventory file not found", 404

@app.route('/get_user_config')
def get_user_config():
    try:
        with open('json/userConfig.json') as file:
            user_config = json.load(file)
            print(user_config)
            return jsonify(user_config)
    except FileNotFoundError:
        return "User config file not found", 404

@app.route('/get_all_config')
def get_all_config():
    try:
        config_data = {}
        
        # Load room config
        with open('json/config.json') as file:
            config_data['rooms'] = json.load(file)
        
        # Load priority config
        with open('json/priority.json') as file:
            config_data['priorities'] = json.load(file)
        
        # Load user config
        with open('json/userConfig.json') as file:
            config_data['users'] = json.load(file)
        
        return jsonify(config_data)
    except FileNotFoundError as e:
        return f"Config file not found: {e}", 404

# standard route, calls HTML page
@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    # run on all IP, run on port 5000
    app.run(host="0.0.0.0", port=80, debug=True)
