CC=gcc
CFLAGS=-Wall -std=c99 -pedantic -pthread -I.
OBJECTS = barrierlist.o segvhandler.o barrier.o main.o

main: $(OBJECTS)
	$(CC) $(CFLAGS) $(OBJECTS) -o membarrier

clean:
	rm -f $(OBJECTS)
