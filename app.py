from flask import Flask, render_template, jsonify, request
import json
import os
from werkzeug.utils import secure_filename
import uuid
app = Flask(__name__)

# Configure upload settings
UPLOAD_FOLDER = 'static/img/issues'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# issue page, user can see issues for a specific room
@app.route('/issues', defaults={'room_id': None})

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
    try:
        with open(issuesFile, 'r', encoding='utf-8') as file:
            issues = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        issues = []
    
    print("Creating issue with data:", data)
    issues.append(data)
    
    try:
        with open(issuesFile, 'w', encoding='utf-8') as file:
            json.dump(issues, file, ensure_ascii=False, indent=4)
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error saving issue: {str(e)}"}), 500

@app.route('/update_issue/<int:issue_index>', methods=['PUT'])
def update_issue(issue_index):
    issuesFile = 'json/issues.json'
    data = request.get_json()
    print("Updating issue at index:", issue_index, "with data:", data)
    try:
        with open(issuesFile, 'r', encoding='utf-8') as file:
            issues = json.load(file)
        
        if 0 <= issue_index < len(issues):
            # Get the existing issue
            existing_issue = issues[issue_index]
            
            # If existing_issue is not a dict, create a new one
            if not isinstance(existing_issue, dict):
                existing_issue = {}
            
            # Merge the new data with existing data
            updated_issue = existing_issue.copy()
            updated_issue.update(data)
            
            # Replace the issue
            issues[issue_index] = updated_issue
            
            with open(issuesFile, 'w', encoding='utf-8') as file:
                json.dump(issues, file, ensure_ascii=False, indent=4)
            return jsonify({"status": "success", "data": updated_issue})
        else:
            return jsonify({"status": "error", "message": "Issue not found"}), 404
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "Issues file not found"}), 404
    except json.JSONDecodeError as e:
        return jsonify({"status": "error", "message": f"JSON decode error: {str(e)}"}), 500

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
            
            try:
                with open(issuesFile, 'w', encoding='utf-8') as file:
                    json.dump(issues, file, ensure_ascii=False, indent=4)
                return jsonify({"status": "success", "deleted": deleted_issue})
            except Exception as e:
                return jsonify({"status": "error", "message": f"Error saving after deletion: {str(e)}"}), 500
        else:
            return jsonify({"status": "error", "message": "Issue not found"}), 404
    except FileNotFoundError:
        return jsonify({"status": "error", "message": "Issues file not found"}), 404
    except json.JSONDecodeError as e:
        return jsonify({"status": "error", "message": f"JSON decode error: {str(e)}"}), 500

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
@app.route('/get_issues')
def get_issues():
    try:
        with open('json/issues.json') as file:
            issues = json.load(file)
            print (issues)
            return jsonify(issues)
    except FileNotFoundError:
        return jsonify({"error": "Issues file not found"}), 404
    except json.JSONDecodeError as e:
        print(f"JSON decode error in issues.json: {e}")
        return jsonify({"error": f"JSON decode error: {str(e)}"}), 500

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
    app.run(host="0.0.0.0", port=80, debug=False)
