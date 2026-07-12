provider "aws" {
  region = "us-west-2"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "TransitOpsVPC"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "TransitOpsPublicSubnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "TransitOpsPrivateSubnet"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "TransitOpsInternetGateway"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "TransitOpsPublicRouteTable"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "api" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "TransitOpsAPISecurityGroup"
  }
}

resource "aws_instance" "api" {
  ami           = "ami-0c55b159cbfafe1f0" # Example AMI ID
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private.id
  security_groups = [aws_security_group.api.name]

  tags = {
    Name = "TransitOpsAPIInstance"
  }
}

resource "aws_db_instance" "default" {
  identifier         = "transitops-db"
  engine             = "mysql"
  instance_class     = "db.t2.micro"
  allocated_storage   = 20
  username           = "admin"
  password           = "password" # Change this to a secure password
  db_name            = "transitops"
  skip_final_snapshot = true

  tags = {
    Name = "TransitOpsDatabase"
  }
}