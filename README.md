# Diary

### Run mongo
`& 'C:\Program Files\MongoDB\Server\3.4\bin\mongod.exe' --bind_ip 127.0.0.1 --dbpath C:\projects\diary\diary-back\mongo\data`

`& 'C:\Program Files\MongoDB\Server\3.4\bin\mongo.exe'`

### Product flow
1.
come to home
if owner not found on localStorage
  prompt for owner. Remember owner on localstorage
redirect to current week (all redirect no refresh as much as possible)

1.1
shows current week, each day's entries.
Starting on Sunday or Monday (configurable). Url is showing /week?date=1970-01-01, where the date is the starting date

1.2
if user visit /week?date=1970-01-01 where date is not the first day of week, redirect to the first day

1.3
Mon/Sun config is saved under collection conf_[ownerName]

4.
there is add button to add entry
it opens textarea in place, with point, title, content, date (default to today) fields.

5.
if tap on a entry, opens same text area, with fields prefilled. The entry is highlighted
Things only for existing entry:
_id set and read-only
delete button

6.
submit button or ctrl+enter to submit, wait for success on server, then render onto view. show loading when req pending
same for delete button

7.
shows sum of points for date every day
