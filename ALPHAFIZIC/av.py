from app import app

# Configuração da chave secreta
app.secret_key = 'alphafizic_secret_2025_change_this_in_production'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)