#!/usr/bin/env python3
"""
Database Analysis Script for Betelgeuse
Analyzes MySQL database structure for incident/ticket audit fields
"""

import pymysql
import json
from datetime import datetime

# Database connection parameters
DB_CONFIG = {
    'host': '190.7.234.37',
    'port': 3025,
    'user': 'ipnext',
    'password': 'ipnext',
    'database': 'ipnext'
}

def connect_db():
    """Connect to MySQL database"""
    return pymysql.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        cursorclass=pymysql.cursors.DictCursor
    )

def show_tables_like(pattern):
    """Show tables matching a pattern"""
    conn = connect_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SHOW TABLES LIKE '%{pattern}%'")
            return cursor.fetchall()
    finally:
        conn.close()

def describe_table(table_name):
    """Get table schema"""
    conn = connect_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"DESCRIBE {table_name}")
            return cursor.fetchall()
    finally:
        conn.close()

def show_indexes(table_name):
    """Show table indexes"""
    conn = connect_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SHOW INDEX FROM {table_name}")
            return cursor.fetchall()
    finally:
        conn.close()

def sample_data(table_name, limit=5):
    """Get sample data from table"""
    conn = connect_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
            return cursor.fetchall()
    finally:
        conn.close()

def count_by_field(table_name, field_name):
    """Count records grouped by field value"""
    conn = connect_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT {field_name}, COUNT(*) as count FROM {table_name} GROUP BY {field_name}")
            return cursor.fetchall()
    finally:
        conn.close()

def main():
    print("=" * 80)
    print("BETELGEUSE DATABASE ANALYSIS - INCIDENT/TICKET AUDIT FIELDS")
    print("=" * 80)
    print()

    # 1. Find incident/ticket tables
    print("1. SEARCHING FOR INCIDENT/TICKET TABLES")
    print("-" * 80)

    incident_tables = show_tables_like('incident')
    ticket_tables = show_tables_like('ticket')
    audit_tables = show_tables_like('audit')

    print("Tables with 'incident' in name:")
    for table in incident_tables:
        print(f"  - {list(table.values())[0]}")

    print("\nTables with 'ticket' in name:")
    for table in ticket_tables:
        print(f"  - {list(table.values())[0]}")

    print("\nTables with 'audit' in name:")
    for table in audit_tables:
        print(f"  - {list(table.values())[0]}")

    print()

    # 2. Analyze main incident table (assuming it exists)
    # Common table names: incidents, tickets, ticket_incidents, splynx_tickets
    potential_tables = []
    for table in incident_tables + ticket_tables:
        table_name = list(table.values())[0]
        potential_tables.append(table_name)

    if not potential_tables:
        print("ERROR: No incident or ticket tables found!")
        return

    # Analyze each potential table
    for table_name in potential_tables:
        print("=" * 80)
        print(f"ANALYZING TABLE: {table_name}")
        print("=" * 80)

        # Get schema
        print("\n2. TABLE SCHEMA")
        print("-" * 80)
        schema = describe_table(table_name)

        audit_related_fields = []
        for field in schema:
            field_name = field['Field']
            field_type = field['Type']
            is_null = field['Null']
            key = field['Key']
            default = field['Default']
            extra = field['Extra']

            # Highlight audit-related fields
            if 'audit' in field_name.lower():
                audit_related_fields.append(field_name)
                print(f">>> {field_name:30} {field_type:20} NULL={is_null:3} Key={key:3} Default={default} {extra}")
            else:
                print(f"    {field_name:30} {field_type:20} NULL={is_null:3} Key={key:3} Default={default} {extra}")

        # Get indexes
        print("\n3. TABLE INDEXES")
        print("-" * 80)
        indexes = show_indexes(table_name)
        for idx in indexes:
            if 'audit' in idx['Column_name'].lower():
                print(f">>> {idx['Key_name']:30} Column={idx['Column_name']:30} Unique={idx['Non_unique']==0}")
            else:
                print(f"    {idx['Key_name']:30} Column={idx['Column_name']:30} Unique={idx['Non_unique']==0}")

        # Sample data
        print("\n4. SAMPLE DATA (first 3 records)")
        print("-" * 80)
        samples = sample_data(table_name, 3)
        for i, record in enumerate(samples, 1):
            print(f"\nRecord {i}:")
            for key, value in record.items():
                if 'audit' in key.lower():
                    print(f"  >>> {key}: {value}")
                else:
                    print(f"      {key}: {value}")

        # Analyze audit fields
        if audit_related_fields:
            print("\n5. AUDIT FIELD VALUE DISTRIBUTION")
            print("-" * 80)
            for field in audit_related_fields:
                print(f"\nField: {field}")
                try:
                    distribution = count_by_field(table_name, field)
                    for row in distribution:
                        value = row[field]
                        count = row['count']
                        print(f"  Value: {value!r:20} Count: {count}")
                except Exception as e:
                    print(f"  Error analyzing field: {e}")

        print("\n")

    # Analyze audit-related tables
    if audit_tables:
        print("=" * 80)
        print("AUDIT TABLES ANALYSIS")
        print("=" * 80)

        for table in audit_tables:
            table_name = list(table.values())[0]
            print(f"\nTable: {table_name}")
            print("-" * 80)

            schema = describe_table(table_name)
            for field in schema:
                print(f"  {field['Field']:30} {field['Type']:20} NULL={field['Null']} Key={field['Key']}")

            # Sample data
            print("\nSample records:")
            samples = sample_data(table_name, 2)
            for i, record in enumerate(samples, 1):
                print(f"\n  Record {i}:")
                for key, value in record.items():
                    print(f"    {key}: {value}")

    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
