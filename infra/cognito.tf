# Cognito User Pool (User Directory)
resource "aws_cognito_user_pool" "pool" {
  name = "${var.project_name}-user-pool-${var.environment}"

  # Allow users to sign in using their email address
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password strength policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Attribute schema config
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "name"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Configure verification emails
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}."
    email_subject        = "Verify your email for Cafinity POS"
  }

  tags = {
    Name = "${var.project_name}-user-pool-${var.environment}"
  }
}

# Cognito Client Application configuration (used by static React frontend in browser)
resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project_name}-web-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.pool.id

  # Generate secret must be false for SPA/Mobile clients (security restriction)
  generate_secret = false

  # Flows enabled for frontend client integration
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}
