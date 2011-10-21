CC=gcc
CFLAGS=-Wall -pthread -I.
OBJECTS = barrierlist.o segvhandler.o barrier.o main.o

main: $(OBJECTS)
	$(CC) $(CFLAGS) $(OBJECTS) -o membarrier

clean:
	rm -f $(OBJECTS)
